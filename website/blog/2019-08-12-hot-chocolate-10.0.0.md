---
title: GraphQL - Hot Chocolate 10.0.0
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

Today we have released version 10 of _Hot Chocolate_. We originally started building version 9.1 which grew bigger and at one point became version 10. We have focused a lot on our server implementation. But let me walk you through our latest release.

<!--truncate-->

## Filters

So, while we focused a lot on the server implementation we also added some nice features to the GraphQL core. The main feature we added here is the new filter API.

Filters let you query your backend with a powerfoul query input type that translates into native databse queries.

```graphql
{
  persons(
    where: { OR: [{ firstName_starts_with: "abc" }, { lastName: "def" }] }
  ) {
    firstName
    lastName
  }
}
```

The above query would translate to a something like `persons.Where(t => t.FirstName.StartsWith("abc") || t.LastName == def)`.

This works out of the box if you are using `IQueryable`.

All you have to do in your schema type is to add a `UseFiltering` to your field descriptor.

```csharp
public class QueryType
  : ObjectType<Query>
{
    protected override void Configure(IObjetcTypeDescriptor<Query> descriptor) {
        descriptor.Field(t => t.GetPersons(default)).Type<ListType<PersonType>>().UseFiltering();
    }
}
```

Filters are easily combined with our pagination.

```csharp
public class QueryType
  : ObjectType<Query>
{
    protected override void Configure(IObjetcTypeDescriptor<Query> descriptor) {
        descriptor.Field(t => t.GetPersons(default)).UsePaging<PersonType>().UseFiltering();
    }
}
```

Also you can customize filters by describing what fields are filterable and what operators are allowed.

```csharp
public class QueryType
  : ObjectType<Query>
{
    protected override void Configure(IObjetcTypeDescriptor<Query> descriptor) {
        descriptor
          .Field(t => t.GetPersons(default))
          .UsePaging<PersonType>()
          .UseFiltering(d => d.Ignore(t => t.LastName));
    }
}
```

If you want to use the same filter multiple times all over your schema you can also describe the filter input type separatly.

```csharp
public class PersonFilterType
    : FilterInputType<Person>
{
    protected override void Configure(
        IFilterInputTypeDescriptor<Foo> descriptor)
    {
        descriptor
            .BindFieldsExplicitly()
            .Filter(t => t.Name)
            .BindOperationsExplicitly()
            .AllowEquals().Name("equals").And()
            .AllowContains().Name("contains").And()
            .AllowIn().Name("in");
    }
}
```

And the use this filter type where you need it.

```csharp
public class QueryType
  : ObjectType<Query>
{
    protected override void Configure(IObjetcTypeDescriptor<Query> descriptor) {
        descriptor
          .Field(t => t.GetPersons(default))
          .UsePaging<PersonType>()
          .UseFiltering<PersonFilterType>());
    }
}
```

The nice thing here is that the filter works out of the box on `IQueryable` and `IEnumerable` so you can use it for databse queries as well as for in-memory lists.

With version 10 of _Hot Chocolate_ we are supporting filters on scalar fields. But we are already working on support for object filters and enumerable filters.

Also we are working on sorting which should be included in the first preview of version 11.

If you want to give input or follow our work you can head over to these four issues that will be coming with version 11.

- [Object Filters #921](https://github.com/ChilliCream/hotchocolate/issues/921)
- [IEnumerable Filters #922](https://github.com/ChilliCream/hotchocolate/issues/922)
- [Sorting #923](https://github.com/ChilliCream/hotchocolate/issues/923)
- [Aggregations #924](https://github.com/ChilliCream/hotchocolate/issues/924)

> Also if you want to checkout more about filters head over to our [documentation](https://hotchocolate.io/docs/filters).

Let me also thank [Pascal](https://github.com/PascalSenn) for his awesome work on this one.

## Subscriptions

Subscriptions was another big investment that we took for this release.

### Redis

For the core API we introduced a _Redis_ subscription provider. This means that you now can use _Redis_ as a pub/sub system without a hassle.

```csharp
var configuration = new ConfigurationOptions
{
    Ssl = true,
    AbortOnConnectFail = false,
    Password = password
};

configuration.EndPoints.Add("host:port");

services.AddRedisSubscriptionProvider(configuration);
```

Thats all you have to do to connect the query engine with `Redis`.

\*\*So why would we want to use `Redis` here anyway.""

The thing with in-memory subscriptions is that they will only work reliable if you have one instance of _Hot Chocolate_ if you are using like us something like kubernetes where you scale on demand that you want to make sure that mutations executed in one server raise an event in another one.

But there is more, sometimes you want to raise an event without triggering a mutation, maybe there was an event somewhere in your infrastructure that you want to know relay as a GraphQL subscription.

We will add _Kafka_ and _Azure EventHub_ with version 11 and we are also looking into other pub/sub systems, so that you can use with what you feel comfortable.

### Pipelines

We also rebuild the whole WebSocket handling in the server by using the new `Pipeline` API that Microsoft introduced to .Net. This makes it now super efficient how we handle the messages with our new `UTF8RequestParser`. I will tell you more about this further down.

> Also if you want to checkout more about subscriptions head over to our [documentation](https://hotchocolate.io/docs/code-first-subscription).

Let me also thank [Gabriel](https://github.com/glucaci) for his great work on subscriptions.

## Batching

Another big feature we have invested in was batching. When we started on this one we reflected a lot about how we want to to this and if we realy need it.

So, when Lee Byron initially showed batching off he explained that this is useful in-case you want to fetch important data first and the delay more expensive data.

They had this example that they want to fetch the news stream of a given user and the comments should appear once those are available.

`POST /graphql?batchOperations=[NewsFeed, StoryComments]`

```graphql
query NewsFeed {
  stories {
    id @export(as: "ids")
    actor
    message
  }
}

query StoryComments {
  stories(ids: $ids) {
    comments(first: 2) {
      actor
      message
    }
  }
}
```

So, in the above query we would first fetch the stories, collect all the story ids and use these as an input to the next query to fetch all the comments for the former stories.

The nice thing is that this is done in one HTTP call and as soon as query one is executed we will write the result into the stream and the client can already work with the data while waiting for the second result.

This all is working over one HTTP call without WebSockets and is super efficient.

**So why did we question its use?**

The thing is that with version 11 we will introduce `@defer` which will allow you to do the following:

```graphql
query NewsFeed {
  stories {
    id @export(as: "ids")
    actor
    message
    ... @defer {
      comments(first: 2) {
        actor
        message
      }
    }
  }
}
```

The fragment that is annotated with `@defer` will be defered to when it is ready. This means you can write queries much cleaner with this and reap the same benifits.

**So, why did we implemeht batching anyway?**

First, you can defer query parts with this now in version 10.

Second, I think batching is very interesting with mutations where you can write complex mutation flows that use the results of one mutation to feed data in the next mutation. The ability to export result data into variables lets you write nice data flows.

Third, we also wanted to support Apollo batching where Apollo collects all the queries of a client in a certain timewindow and sends those in one request to our server. One batch will share the _DataLoader_ instances which means that the batch request will be faster then sending them in separatly.

> We are supporting operation batching and request batching and if you would like to know more about it head over to our [documentation](https://hotchocolate.io/docs/batching).



PERSISTED QUERIES

REQUEST PARSER + PARSER PERF

Subscription now uses pipeline API to abstract sockets.

SERVER MODULARIZATION

## Version 11

Like with every release we are giving a little outlook. As the releases are fluid we are sometimes moving things around.

We want to really foucus on two major topics with this release.

## Query Execution Plans

## Client API

## The Other Things

We also will add more features to our filter API and will add more subscription provider.

Also like with every of our releases we will make the parser more efficient. The next thing here is to use `ReadOnlySlice`

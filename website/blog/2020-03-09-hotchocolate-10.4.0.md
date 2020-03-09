---
title: GraphQL - Hot Chocolate 10.3.0
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

![Hot Chocolate](/img/blog/hotchocolate-banner.svg)

Today we are releasing _Hot Chocolate_ version 10.4.0. With 10.4.0 we are releasing our final version 10 build. With this new version we concentrated on pure code-first and the Entity Framework integration. Better Entity Framework integration was one of the most asked features from our user base.

<!--truncate-->

While you could already build GraphQL schemas with _Hot Chocolate_ and use _Entity Framework_ there were always you had to work around. For one the GraphQL query algorithm executes by default resolvers in parallel leading to possible multi-thread exceptions with the _Entity Framework_ since `DBContext` is not built for multiple threads fetching data from it.

## Resources

The new execution engine for version 11 has a new concept called resources. A resource can define how it can be accessed by the execution engine. For 10.4 we ported part of the concept back. With this you can now define resources with the current execution engine in a very simple way.

```csharp
public class MyEfContextResource : Resource
{
    protected override void Configure(IResourceDescriptor descriptor)
    {
        descriptor.Name("MyEfContext")
            .Service<MyEfContext>()
            .DataLoader("UserById")
            .DataLoader<UserByEmailDataLoader>()
            .SingleThreadAccess();
    }

}

SchemaBuilder.New()
    ...
    .AddResource<MyEfContextResource>()
    .Create();
```

A resource basically describe how we can access a set of services and DataLoader. In the above example the resource `MyEfContext` consists of the service `MyEfContext`, the _DataLoader_ `UserById` and the _DataLoader_ `UserByEmailDataLoader` and defines that it is a single thread resource.

The execution in this case will queue resolvers around this resource and ensure that the resource is only accessed by a single thread of the execution engine.

This means that the execution engine can now much better optimize accessing data sources since it can ...

## Projections

A further feature our users where asking for are projections. Projections let us basically rewrite the GraphQL query into a expression tree on top of `IQueryable` and select the whole data in one go from the database.

Let us see how we could use our new projections API.

_Pure Code-First:_

```csharp
public class Query
{
    [UseSelection]
    public IQueryable<Person> GetPersons([Service]MyEfContext context)
    {
        return context.People;
    }
}
```

_Code-First:_

```csharp
public class QueryType : ObjectType<Query>
{
    protected override void Configure(IObjectTypeDescriptor<Query> descriptor)
    {
        descriptor
            .Field(t => t.GetPersons(default))
            .Type<ListType<PersonType>>()
            .UseSelection();
    }
}

public class Query
{
    public IQueryable<Person> GetPersons([Service]MyEfContext context)
    {
        return context.People;
    }
}
```

With just this attribute the selection middleware will now rewrite the GraphQL query for this field to select exactly the requested data from our database without the need to write any additional resolvers, all data are correctly included.

The new selection middleware can be combined with our filtering, sorting and paging middleware.

_Pure Code-First:_

```csharp
public class Query
{
    [UsePaging]
    [UseSelection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Person> GetPersons([Service]MyEfContext context)
    {
        return context.People;
    }
}
```

_Code-First:_

```csharp
public class QueryType : ObjectType<Query>
{
    protected override void Configure(IObjectTypeDescriptor<Query> descriptor)
    {
        descriptor
            .Field(t => t.GetPersons(default))
            .Type<ListType<PersonType>>()
            .UsePaging()
            .UseSelection()
            .UseFiltering()
            .UseSorting();
    }
}

public class Query
{
    public IQueryable<Person> GetPersons([Service]MyEfContext context)
    {
        return context.People;
    }
}
```

These new selection middleware is not bound to _Entity Framework_ but can be used with any database provider that allows to query data through `IQueryable`.

## DataLoader Base Classes

_Hot Chocolate_ has _DataLoader_ support now for a long time but implementing a _DataLoader_ class was still a lot of work with repetitive code.

We now introduce our new DataLoader base classes that perfectly align with the already existing helper methods on the resolver context.

- `BatchDataLoader<T>`
- `GroupedDataLoader<T>`
- `CacheDataLoader<T>`

## State Attributes

Apart from all those new database helpers we also looked again at pure code-first and how to make it better. We for a long time allowed to have custom user state during the execution. The state could be global or scoped.

We also had the `StateAttribute` which indicated that the execution engine should inject a value from the state into a resolver.

_Global State:_

```csharp
public async Task<Person> GetPersonAsync([State("CurrentUser")]Person currentUser)
```

_Scoped State:_

```csharp
public async Task<Person> GetPersonAsync([State("CurrentUser", IsScoped = true)]Person currentUser)
```

The state attribute was quite verbose and could only inject readonly values into the resolver. Moreover, with version 11 we are introducing local states and with that it would add even more complexity to that attribute.

With 10.4 we are now introducing a new way to handle state. First, we now allow to read and write state through resolver injection.

Lets first look at our first example, injecting global state.

```csharp
public async Task<Person> GetPersonAsync([GlobalState]Person currentUser)
```

The new `GlobalState` attribute will tell the resolver compiler that the parameter is actually something from the global state. By default the name under which the state is persisted in the execution context is the name of the parameter. But we still can explicitly define that name.

```csharp
public async Task<Person> GetPersonAsync([GlobalState("CurrentUser")]Person currentUser)
```

Also, you know can tell the execution engine to inject a default if that custom state does not yet exist.

```csharp
public async Task<Person> GetPersonAsync([GlobalState]Person currentUser = null)
```

In the above example we tell the execution engine to give us null if it does not exist on the execution context.

This leaves us with our last problem, how to write some state back to the execution engine. In the past we would need to inject the resolver context and the access the `ContextData` explicitly. With the new state attributes a can ask the engine to inject me a mutator for that specific state.

```csharp
public async Task<Person> GetPersonAsync([GlobalState]Action<Person> setCurrentUser)
```

Again we can infer the correct name. A mutator can be named like the state or can start with set + `StateName`. Again you also can explicitly provide the state.

In order to access or write to the scoped state we just use our new `ScopedStateAttribute` and are able to do the same thing.

If you are trying out the new version 11 previews than you will even have a `LocalStateAttribute` which can modify and access state that only exists in the current resolver pipeline.

## Default Values

Another aspect that we have looked at are default values for pure code-first. With code first default values can be simply provided through the `DefaultValue` descriptor. But until now there was now nice way to provide default values in pure code-first.

We now infer default values from the default values of parameters. This means that if you have a resolver like the following ...

```csharp
public class Query
{
    public string SayHello(string greetings = "Hello World") => greetings;
}
```

... we will infer the query type like the following ...

```graphql
type Query {
    sayHello(greetings: String! = "Hello World") : String!
}
```

This feels natural to us C# developers and lets us write our C# schema without adding clutter.

...

## Subscriptions

## All the rest

Aside from the bigger features we have refined the _Hot Chocolate_ further. We switched from JSON.Net to System.Text.Json for the result serialization. We already use our own Utf8GraphQLRequestParser for the in-coming GraphQL JSON requests. We still use JSON.NET for subscription messages. We will have those last bits of code migrated that use JSON.NET with version 11.

We also fixed a lot of bugs with this release optimized the type discovery and did some other house cleaning tasks.

## Looking ahead

With this release out version 10 is now finally complete. We are now fully focusing on version 11 which will bring a new execution engine that will allow us to create new features that we could not do with the current generation like @defer and @stream.

Version 11 will take GraphQL to gRPC and allow you to serve GraphQL over a multitude of transports. Further, version 11 will fully support GraphQL 2020.





BTW, head over to our _pure code-first_ [Star Wars example](https://github.com/ChilliCream/hotchocolate-examples/tree/master/PureCodeFirst).

If you want to get into contact with us head over to our [slack channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) and join our community.

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

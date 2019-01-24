---
title: GraphQL - Schema Stitching
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

What is schema stitching actually? Schema stitching is the capability to merge multiple GraphQL schemas into one schema on which queries can be executed.

<!--truncate-->

## Introduction

So, for what is that useful? In our case we have lots of specialized services that serve data for a specific problem domain. Some of these services are GraphQL services, some of them are REST services and yes sadly a little portion of those are still SOAP services.

Also, think about this, you cannot always start fresh and with schema stitching you can now create the schema of your **dreams** and merge all those other services into that one and new glorified schema.

Apart from that UI teams tend to not want to know about all those domain services and their specifics. They want to be able to fetch the data they need with one call, no under- or over-fetching and most importantly no repeated fetching.

Furthermore, we believe the schemas should be consistent and provide a way that is easily to consume.

With the preview version 0.7.0-preview.35 we are now introducing schema stitching capabilities to _Hot Chocolate_.

In this post I will walk you through how you can use schema stitching, what will be available with version 0.7.0 and what features come with the next releases.

## Getting Started

Assume we have two schemas one dealing with the customer data, basically the data that would be located in a CRM system, the other representing insurance data about the customer.

The stitching layer is not limited to two schemas you can actually stitch together how many schemas you want.

So, let's say our customer schema looks something like the following:

```graphql
type Query {
  customer(id: ID!): Customer
  consultant(id: ID!): Consultant
}

type Customer {
  id: ID!
  name: String!
  consultant: Consultant
}

type Consultant {
  id: ID!
  name: String!
}
```

And our second schema dealing with the insurance contracts looks like the following:

```graphql
type Query {
  contract(contractId: ID!): Contract
  contracts(customerId: ID!): [Contract!]
}

interface Contract {
  id: ID!
}

type LifeInsuranceContract implements Contract {
  id: ID!
  premium: Float
}

type SomeOtherContract implements Contract {
  id: ID!
  expiryDate: DateTime
}
```

Imagine we have two servers serving up those schemas. The schema that we actually want for our UI team should look like the following:

```graphql
type Query {
  customer(id: ID!):Customer
}

type Customer {
  id: ID!
  name: String!
  consultant: Consultant
  contracts: [Contract!]
}

type Consultant {
  id: ID!
  name: String!
}

interface Contract {
  id: ID!
}

type LifeInsuranceContract implements Contract {
  id: ID!
  premium: Float
}

type SomeOtherContract implements Contract {
  id: ID!
  expiryDate: DateTime
}
```

In order to make that happen you do not have to write actual code, we have create some directives that will tell the stitching layer what to do.

Before we start, we have to give our schemas some names, these names will be needed to direct the remote queries into the right direction. Let's name the customer schema `customers` and the contract schema `contracts`. With that let's decorate our desired schema.

```graphql
type Query {
  customer(id: ID!): Customer
    @schema(name: "customer")
    @delegate
}

type Customer {
  id: ID!
  name: String!
  consultant: Consultant
  contracts: [Contract!]
    @schema(name: "contract")
    @delegate(path: "contracts(customerId:$fields:id)")
}

type Consultant {
  id: ID!
  name: String!
}

interface Contract {
  id: ID!
}

type LifeInsuranceContract implements Contract {
  id: ID!
  premium: Float
}

type SomeOtherContract implements Contract {
  id: ID!
  expiryDate: DateTime
}
```

`@schema` basically point to the source schema, so the stitching middleware will redirect calls to a schema with the name that is specified by this directive.

`@delegate` specifies how the data is fetched. If `@delegate` does not have any path specified than the middleware expects that the field on the target schema has the same specification.

If we look at the `customer` field then the middleware will assume that the source schema has the same customer field as root field.
The `contracts` on the other hand specifies a delegation path `contracts(customerId:$fields:id)`. The delegation path specifies the field that is called and where the arguments get their input from.

Let us assume you have a deeper field from which you want to fetch data like the following.

```graphql
foo(id:123) {
  bar {
    baz(top:1) {
      qux
    }
  }
}
```

Since, we did not want to cram a query like this into one string we allow this to be done with a flat path.

```
foo(id:$arguments:arg1).bar.baz(top:1)
```

The argument assignment in the path can be done with GraphQL literals or with scope variables. The scope variables basically can refer to the fields of the declaring type (in case of our contracts field the declaring type is customer) and to the arguments of the field.

## Server Configuration

Now that we have configured our schema let's create our server. The fastest way to do that is to use our server template.

Install the server template to your dotnet CLI:

```bash
dotnet new -i HotChocolate.Templates.Server
```

Now let's create our server:

```bash
mkdir stitching
dotnet new graphql-server
```

Open the server in the editor of your choice and upgrade the packages to 0.7.0-preview.35.

Go to the Startup.cs and add the HTTP clients that shall access remote schema endpoints like the following:

```csharp
services.AddHttpClient("customer", client =>
{
    client.BaseAddress = new Uri("http://127.0.0.1:5050");
});

services.AddHttpClient("contract", client =>
{
    client.BaseAddress = new Uri("http://127.0.0.1:5051");
});
```

Also, the authentication and header properties for your remote endpoints have to be added to your clients.

The clients must be named clients and have to use the schema name that we used in our schema directive earlier.

Next let's setup our remote schemas. Remote schemas are actually local schemas representing the remote schemas and allowing us to treat the remote schema as if it were a usual schema written with _Hot Chocolate_. This also allows us to create middleware components and other things on such a schema althogh the schema does not actually live in our process.

So let us start with the customer schema, the customer schema does only use scalars defined in the spec. This means we do not have to declare any extra scalars.

```csharp
serviceCollection.AddRemoteQueryExecutor(b => b
    .SetSchemaName("customer")
    .SetSchema(File.ReadAllText("Customer.graphql")));
```

Again we use our the schema name that we used earlier and we are loading a schema file describing the remote schema into the remote executor. We are basically building with that a schema the way you would to with the schema-first approach.

Next, let's setup our contracts schema. The contracts schema uses a `DateTime` scalar, this one is not specified in the spec so we have to tell our schema to use this one. Since _Hot Chocolate_ specified a bunch of extended scalars we can import one of those. If we do not have a scalar matching the one of the scalar in a remote schema we would need to implement this one by extending the class ScalarType.

```csharp
serviceCollection.AddRemoteQueryExecutor(b => b
    .SetSchemaName("contract")
    .SetSchema(FileResource.Open("Contract.graphql"))
    .AddScalarType<DateTimeType>());
```

Now that we have setup our remote schema let's stitch everything together by providing our prepared stitched schema file:

```csharp
serviceCollection.AddStitchedSchema(
    FileResource.Open("Stitching.graphql"),
    c => c.RegisterType<DateTimeType>());
```

Again like before we have to provide the extended scalar type that we used.

## Further Thoughts

Since, remote schemas have a local schema representing the remote schema in our process and the stitching layer working on those local schema we can also use native _Hot Chocolate_ schemas to further extend a stitched schema.

So, all what I have described so far is included in the current preview release. We are still not done and are heavy at work getting our schema stitching even better. With the next view preview builds we will introduce a batching layer to the schema stitching. Think _DataLoader_. We will basically batch all request to a schema in one go. Imagine we had two delegated query for one remote schema:

Query A:

```graphql
{
  a {
      b
  }
}
```

Query B:

```graphql
{
  c {
      d
  }
}
```

The batching layer will rewrite those queries into one and send just one request to your remote endpoint:

```graphql
{
  __1: a {
      b
  }

  __2: c {
      d
  }
}
```

This way we have just one call and your remote endpoint can better optimize the data fetching with _DataLoader_ and so on.

## Comming with 0.8.0

Furthermore, we will introduce the ability to rename types. This is useful when you either want to make names more clear or if you have naming collisions. So, with the next releases we will introduce '@name' as a way to rename types and fields.

Also, the ability to auto-stitch schemas and auto-fetch the a remote schema via introspection is on our todo list.

In the beginning of this post I talked about stitching SOAP and REST, we are currently working on a feature that is called HTTP directives. HTTP directives let you decorate a schema SDL and thus let you map REST services onto a GraphQL schema. This schema can also be included into a stitched schema. We will tell more about that once we have a stable version of that ready.

## Wrapping things up

We have uploaded the above example to the following GitHub repo so you can see a working example of the schema stitching.

[Stitching Example](https://github.com/ChilliCream/hotchocolate-examples)

If you are using the example start the two remote schemas by switching to their respective directory and call `dotnet run`.

After bot schemas are running start the stitching layer. The stitching layer has `Apollo Tracing` enabled. Start the stitching layer also with `dotnet run` since the debugger slows the performance significantly down.

The first call an the stitched api takes a little bit longer (maybe 300 ~ 500 ms) since we are compiling the resolvers into a in-memory assembly all further calls are fast (4 ~ 8 ms).

Open playground on http://localhost:5000/playground in order to fire up some requests agains our stitched schema and checkout the tracing tab for performance insights.

If you have further questions or need help you join our slack group: [Hot Chocolate on Slack](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTBkZjNjZWIzMmNlZjQ5MDQyNDNjMmY3NzYzZjgyYTVmZDU2YjVmNDlhNjNlNTk2ZWRiYzIxMTkwYzA4ODA5Yzg).

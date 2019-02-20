---
title: GraphQL - Schema Stitching with Version 8
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

We are currently working on version 8 of Hot Chocolate and are mainly focusing on schema stitching with this release.

One of the most requested features in this area was auto-stitching. Auto-stitching will enable us to automatically pull in schemas from other GraphQL servers and merge those into one schema.

<!--truncate-->

## Auto-Stitching

So, how does this work without making a big mess? With version 8 we are introducing a new builder class called `StitchingBuilder`.

The `StitchingBuilder` will allow us to define through a simple API, what schemas we want to merge.

Moreover, the `StitchingBuilder` allows us to define merge rules in order to customize the merging process to our needs.

Let us start with a simple example. In the last stitching blog post I provided two schemas, one was focusing on customer data and the other one was focusing on the contracts that a customer has with the company.

Customer Schema:

```graphql
type Query {
  customer(id: ID!): Customer
  consultant(id: ID!): Consultant
  customerOrConsultant(id: ID!): CustomerOrConsultant
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

union CustomerOrConsultant = Customer | Consultant
```

Contract Schema:

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

In order to merge the two schemas with our new API we basically have to write the following code:

```csharp
services.AddHttpClient("customer", client => client.BaseAddress = new Uri("http://127.0.0.1:5050"));
services.AddHttpClient("contract", client => client.BaseAddress = new Uri("http://127.0.0.1:5051"));

services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer"));
```

With that the `StitchingBuilder` will pull in the schemas from the provided endpoints and create the following schema:

Customer Schema:

```graphql
type Query {
  customer(id: ID!): Customer
  consultant(id: ID!): Consultant
  customerOrConsultant(id: ID!): CustomerOrConsultant
  contract(contractId: ID!): Contract
  contracts(customerId: ID!): [Contract!]
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

union CustomerOrConsultant = Customer | Consultant

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

Without doing much we now have one schema, but we would like to improve our merged schema and integrate the types with each other.

## Extending Types

For example, we would like the `Customer` to have a property `contracts` that exposes the contracts of that particular customer. 

The GraphQL SDL supports a keyword `extend` which basically lets us extend existing types.

With the new `StitchingBuilder` we added support for this.

```graphql
extend type Customer {
  contracts: [Contract!]
    @delegate(schema: "contract", path: "contracts(customerId:$fields:id)")
}
```

Instead of providing the fully stitched schema we can now describe the missing bits of our schema and add those like the following:

```csharp
services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer")
    .AddExtensionsFromFile("extensions.graphql"));
```

The extension files can also contain new types or types that we want to replace in the merged schema.

>Extended fields can also be bound to field resolvers.

We now have a schema that is more consistent and allows us to fetch the customer and it's contracts with one request.

## Rewriter

So, this is nice, but what if we want to remove parts of the schema or rename types.

The `StitchingBuilder` can be enhanced by writing schema rewriters. We added a bunch of schema rewriters for cases we found useful.

This basically means that we do not have to write schema rewriters for every little thing like renaming a type.

Let us for example rename the `LifeInsuranceContract` to `LifeInsurance`.

```csharp
services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer")
    .AddExtensionsFromFile("extensions.graphql")
    .RenameType("contract", "LifeInsuranceContract", "LifeInsurance"));
```

Next, we do not want to expose all the root-fields of the original schemas. So, lets say we only want to expose the root-fields from the customer schema and ignore the root-fields from the contracts schema.

```csharp
services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer")
    .AddExtensionsFromFile("extensions.graphql")
    .RenameType("contract", "LifeInsuranceContract", "LifeInsurance")
    .IgnoreRootTypes("contract"));
```

Since, we are at it let us also get rid of the `customerOrConsultant` root field from the customer schema.

```csharp
services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer")
    .AddExtensionsFromFile("extensions.graphql")
    .RenameType("contract", "LifeInsuranceContract", "LifeInsurance")
    .IgnoreRootTypes("contract")
    .IgnoreField("Query", "customerOrConsultant"));
```

>If we do not specify the source schema with a rewriter, then the rewriter will be applied to all source schemas.

After all those modifications our new stitched schema should look like the following:

```graphql
type Query {
  customer(id: ID!): Customer
  consultant(id: ID!): Consultant
}

type Customer {
  id: ID!
  name: String!
  consultant: Consultant
  contracts: [Contract!]
    @delegate(schema: "contract", path: "contracts(customerId:$fields:id)")
}

type Consultant {
  id: ID!
  name: String!
}

union CustomerOrConsultant = Customer | Consultant

interface Contract {
  id: ID!
}

type Life implements Contract {
  id: ID!
  premium: Float
}

type SomeOtherContract implements Contract {
  id: ID!
  expiryDate: DateTime
}
```

The stitching layer will keep track of what we rename and rewrite queries to the source schema accordingly.

We can also write our own rewriter. There are basically two kinds of schema rewriter:

- Document Rewriter
  This one operates on a schema document and is able to remove or add types.

- Type Rewriter
  The type rewriter operates on a type definition and can rename types, add, rename and remove fields or add directives to it.

Custom rewriters can be defined like the following:

```csharp
builder.AddTypeRewriter((schema, typeDefinition) =>
{
    return typeDefinition.Rename("Foo");
})
```

## Merge Rules

Merge rules are at the heart of our auto-stitching functionality and basically describes how types are merged when we have name collisions.

For instance if we would have the following enum in both schemas, then we would merge it into one type in the target schema:

```graphql
enum CustomerType 
{
    PERSON
    COMPANY
}
```

If, the enums would have the same name but different values for instance, we would rename one of the types:

```graphql
enum CustomerType
{
    PERSON
}

enum Contract_CustomerType
{
    COMPANY
}
```

The enum merge rule would basically add the schema name in-front of the type name and thus create a unique new name.

Since, schema rewriters run before the merge rules are executed we can define our own name for the colliding type without writing a merge rule.

But, if we wanted to merge the enums nevertheless then we could write a merge rule that does exactly that.

The merge process defined as a chain of responsibility, where the rules are chained together and we pass along what we are not able to handle.

The merge process will bucket the types by name. Each merge rule gets a collection of types with the same name and then applies its merge logic to those types.

We can handle some of the types and pass the rest of the types to the next rule by invoking the `next` delegate.

```csharp
builder.AddMergeHandler(next => (context, types) =>
{
    // merge logic goes here ...
});
```

We have added some default merging rules that should suffice in most cases.

## Code-First

Since, the stitched schema is just a schema like any other, we can also add custom types with code first and that write a resolver that integrates those.

```csharp
services.AddStitchedSchema(builder => builder
    .AddSchemaFromHttp("contract")
    .AddSchemaFromHttp("customer")
    .AddExtensionsFromFile("extensions.graphql")
    .RenameType("contract", "LifeInsuranceContract", "LifeInsurance")
    .IgnoreRootTypes("contract")
    .AddSchemaConfiguration(c =>
    {
      c.RegisterType<FooType>();
    }));
```

The same way you can configure the execution pipeline with `AddExecutionConfiguration`.

We will add more code-first integration with the next release like `ObjectTypeExtension`, `InterfaceTypeExtension` and so on.

## Remote Query Client

With this release we are now also introducing a stitching query client. This lets us delegate calls to a remote schema in our custom resolvers:

```csharp
builder.AddSchemaConfiguration(config => 
{
    config.BindResolver(async ctx => 
    {
        IRemoteQueryClient queryClient = 
            ctx.Service<GetRemoteQueryClient>()
            .GetRemoteQueryClient("contract");
        IExecutionResult result = await queryClient.ExecuteAsync(
            "{ foo { bar { baz } } }");
        return ctx.HandleResult(result, "/foo");
    });
})
```

## Batching

Like with _DataLoader_ the stitching layer is now batching calls to the remote schemas. This reduces the calls to the remote-schemas significantly and improves the overall performance.

So, if we had two query calls:

Query 1:

```graphql
{
  customer(id: "abc") {
    name
    contracts {
      id
    }
  }
}
```

Query 2:

```graphql
{
  customer(id: "def") {
    name
    contracts {
      id
    }
  }
}
```

We would merge those two queries into one:

```graphql
{
  __1: customer(id: "abc") {
    name
    contracts {
      id
    }
  }
  __2: customer(id: "def") {
    name
    contracts {
      id
    }
  }
}
```

This lets the remote schema optimize the calls much better since now the remote schema could take advantage of things like _DataLoader_ etc.

## Example

This post is based on Hot Chocolate version 0.8.0-preview.5. We have an example with the new API here: [Stitching Example](https://github.com/ChilliCream/hotchocolate-examples/tree/master/Stitching)

## TODOs

We are still quite busy with the current changes. We are working on renaming of input types and their fields and related areas.

Moreover, we are working to make it easy to stitch relay schemas together. The main issue with that at the moment is the node resolver.

Since, we can pass any ID to the node resolver and get the associated object returned we have to keep track of where those IDs come from.

We could ask all the node resolvers that we know, but this would feel not good. We think that we can finish this issues off by the end of this week and move to release the new stitching layer.

## Version 9

We originally wanted to include subscription stitching with version 8, but are now moving this feature to next version.

Apart from that, Version 9 will mainly focus on schema improvements.

If you have feedback or feature requests for our schema stitching we love to talk to you about it. Head over to our slack channel:

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTBkZjNjZWIzMmNlZjQ5MDQyNDNjMmY3NzYzZjgyYTVmZDU2YjVmNDlhNjNlNTk2ZWRiYzIxMTkwYzA4ODA5Yzg) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |

[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

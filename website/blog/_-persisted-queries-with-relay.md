---
title: Using Persisted Queries
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

![Hot Chocolate](/img/blog/hotchocolate-banner.svg)

With GraphQL the backend has fundamentally changed and empowers now the consumer of the API to define the interface that he/she wants to use.

We no longer are dependant on the backend developer to build us specific request so that we get data as efficiently as possible. Instead nowadays we in teams talk about data graphs that expose the available data to us.

These data graphs are more natural to explore and are in line with how we think about data. No longer do we need about how we can get a specific entity with a key from a previous call. Drilling into those data graphs is easy and understandable.

But it also leads us to multiple challenges when we think about bringing our GraphQL server into production.

So, I thought it would be a good idea to explore these challenges and show how we can tackle these with Hot Chocolate.

In this first post I will look at how we can improve performance and security with persisted queries. For this post I will use Hot Chocolate as our GraphQL server and relay as our GraphQL client.

<!--truncate-->

## Bandwidth

While GraphQL is great and lets us iterate much faster by allowing the frontend engineer to build their own request we also will end up sending large requests with our query over the wire. These queries are kind of static and do not change once our application is deployed.

Lets have a look at a standard GraphQL request:

```json
{
  "operationName": "sendMessage",
  "query": "mutation sendMessage($recipientEmail: String!, $text: String!) {\n  sendMessage(input: {recipientEmail: $recipientEmail, text: $text}) {\n    message {\n      ...message\n    }\n  }\n}\n\nfragment message on Message {\n  id\n  direction\n  sender {\n    ...participant\n  }\n  recipient {\n    ...participant\n  }\n  sent\n  text\n}\n\nfragment participant on Person {\n  name\n  email\n  isOnline\n}\n",
  "variables": {
    "recipientEmail": "foo@bar.com",
    "text": "Hello World"
  }
}
```

The standard GraphQL request over HTTP consists of the query, the operation name and the variables.

The query contains a GraphQL query document which can contain multiple operations.

The operation name indicates which of the operations contained in the GraphQL query document shall be executed.

Last we have the variables which basically represent the arguments that I will pass into the operation that I want to execute.

With relay or also with Strawberry Shake the query document is produced and known at build time and it will not change at runtime. If we think about this than sending in a static query document every time will produce a lot of traffic and actually gives us now benefit.

Facebook has specified for that reason persisted queries. With persisted queries the query documents are stored in a cache or in a database or where ever you want. Instead of sending in the query document each time we will just send an id to the server under which we have stored our query.

```json
{
  "operationName": "sendMessage",
  "query": "{MyQueryDocumentID}",
  "variables": {
    "recipientEmail": "foo@bar.com",
    "text": "Hello World"
  }
}
```

With this small peak we are suddenly sending in dramatically less to the server. Moreover, the server can optimize those queries and also since these queries are known and tested, the server can skip validation of those queries. The server will just lookup the query, skip the whole parsing and validation step and jump right into execution the queries.

We are still flexible with GraphQL we can still define our queries the way we want to but in the moment we deploy our frontend we can export all the queries that it uses and push those to our GraphQL server. This means we are flexible and can iterate fast when we develop our frontend but in the moment our frontend transitions into to the outside world it will become static and improves performance.

## Security

In many projects people are not hosting GraphQL servers for other to access their company data like for instance GitHub does. Meaning, many companies want to use the power of GraphQL and improve how they can develop their portals but do not actually intend to provide a GraphQL server for others. That means that the exposed surface to fetch data on the backend is actually a problem. We could easily start querying such a server with large queries and affect the health of such a system.

There are indeed a lot of approaches here to mitigate such issues but in this particular case whitelisting the queries against the persisted queries can be an easy solution to have predictable tested performance and secure the server against unwanted queries.

If you think about it, after we have deployed our backend and frontend only predefined queries can be executed. These requests are tested and tried so we have very easily achieved all the benefits that you have with rest in this regard by still having all the capabilities of GraphQL.

## Lets put it together

So let us explore how we could setup persisted queries with Hot Chocolate and relay.

Persisted query support is built into Hot Chocolate and we actually support two flavors. Moreover, Hot Chocolate has three built-in persistance provider. We can store queries in a redis cache, on the file system or in our schema registry (Marshmallow Pie).

The first thing we have to decide where we want to store our queries. In this post we will use the file system.

In order to add the file system provider to our project we need to add the following package to our repository:

```bash
dotnet add package HotChocolate.PersistedQueries.FileSystem
```

Next we need to add the storage to our services:

```csharp

```

After we have done this our server is configured to lookup queries from the directory `persisted-queries`.






If you want to get into contact with us head over to our [slack channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) and join our community.

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

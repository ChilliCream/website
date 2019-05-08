---
title: GraphQL - Hot Chocolate 9.0.0 - Performance
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

Today we release preview 27 of version 9 and we are heading toward RC status which we are planning to hit next week.

This post will describe what we have done since preview 9 and where we are heading.

<!--truncate-->

One of the main focuses on the second part of this release was performance. Performance will stay one big focus point for us.

## Parser

The version 8 parser that we have built and maintained since version 1 was a very close port of the nodejs parser of `graphql-js`. `graphql-js` is the reference implementation of _GraphQL_ and also is basically the core of _Apollo_ and _relayjs_.

The problem that we had with the approach of the parser was that it parsed on a string. Basically, the parser tokenized the string which meant that there was a lot of substrings creating new strings and so on.

Each time we use the V8 parser to parse a _GraphQL_ request we basically created a lot of objects. Instead of just producing our parsed _GraphQL_ document we have created a lot of garbage for the runtime to clean up.

With version 9 we wrote the parser from scratch to be allocation free. This means that we only use memory to create our GraphQL document tree but not for the actual parsing.

In order to do that we are no longer parsing using a string but a `ReadOnlySpan<byte>`. With spans on byte we can basically read the query from a binary stream and produce the GraphQL document without producing string object.

Moreover, our new parser is now a `ref struct` meaning that all the memory we allocate for the parser state is allocated on the stack.

We still will keep our old parser around and will update both parsers going forward.

But we did not stop here. Actually, the GraphQL HTTP request is really bad to be processed efficiently. So, with version 9 we are actually still parsing from a string with our new parser.

The issue here is that we first have to parse the server request which is JSON and then can use the GraphQL query stored as string in the JSON structure to parse the actual GraphQL query document.

This means that with version 9 we are around 2 to 3 times faster than any .net parser implementation.

But as I said we are __NOT__ stopping here, we are working on a new specialized request parser that will integrate the JSON parser with the GraphQL parser. That means that we are able to read the GraphQL request directly from the network stream and parse it without any manifestation to a string.

Version 9 will bring the new `Utf8GraphQLParser` and we will follow that up with the `Utf8GraphQLRequestParser` in version 9.1.

In our experiments we see that this new request parser is about 10 times faster then the GraphQL-DotNet parser combined with Json.Net.

Also, as a side note the version 9 parser now supports all the GraphQL draft features and represents the most GraphQL spec compliant implementation on the .Net platform.

## Resolver Compiler

With version 9 we have removed the Roslyn compiler and are now using the expression compiler to compile our resolvers. This change was done since Roslyn caused the server to consume a lot of memory. Most of the memory was consumed by native metadata references and we were not able to solve that. At build I talked to David Fowler about that and he knew about that issue and recomended that we move to expressions. The downside here is that the resolvers produced by the expression compiler are actually a little bit slower then resolvers compiled by roslyn. This has many reasons I do not want to go in here.

With version 9.1 we will further optimize the resolver compilation by allowing lazy compilation, this will imnprove startup performance.,

## Execution Engine

We have updated our execution engine to use less memory and execute faster. The new execution engine is at least 2.3 times faster and uses half of the memory GraphQL-DotNet does. If you are using schema first we are actually 8.9 times faster the GraphQL-DotNet.

GraphQL-DotNet is still faster when validating queries, bit this is offset since we are caching validation results.

Validation, will be one of the this we will work on version 9.1.

Also we are putting a lot of work in our new execution plan feature. With execution plans we are seeing 3 times faster performance then with our current version 9 builds.

The execution plan feature allows us to preanalyze the query graph and in many cases optimize the execution of resolvers significantly. We will talk about this more after we have shipped version 9.

## Serialization

The serialization of query results is also one of the areas we want to improve. Microsoft, did a lot of work in this area and we are waiting here for the new UTF8 APIs that will ship with .NET Core 3. We are completly removing Json.NET over the next releases in order to improve performance further.

## Summary

We are investing heavily in performance and stability. One other area we are working on is the subscription implementation. We will replace the current implementation with one built on top of the Microsoft pipeline API, this is why we are moving agin subscription stitching.

Stitching is also one area we will start to improve performance wise once we have the execution plan feature implemented.

The bottom line here is that if you go with _Hot Chocolate_ you will get the most spec compliant and most performant GraphQL server on the .net platform.

Each time a GraphQL spec element hits draft we will implement it with _Hot Chocolate_, this means that with _Hot Chocolate_ you will get the latest GraphQL features.














| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTBkZjNjZWIzMmNlZjQ5MDQyNDNjMmY3NzYzZjgyYTVmZDU2YjVmNDlhNjNlNTk2ZWRiYzIxMTkwYzA4ODA5Yzg) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate
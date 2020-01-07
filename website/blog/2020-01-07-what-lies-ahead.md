---
title: The state of GraphQL on the .NET Platform
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

For years now we .NET developers have looked a little envious to the JavaScript platform in regards to GraphQL. All the cool tools and libraries where there. Our platform just could not stack up to what was available in the JavaScript realm.

This is why we started our work on the _Hot Chocolate_ server. We wanted to bring something of these awesome ideas that we could see on other platforms home to .NET.

There are always different phases in software development and for people on the outside it sometimes is difficult to see the whole picture. I think with the next view preview releases that are coming over the next three month this picture will become clear. For me personally it is awesome to see how these things come slowly together. I still remember the day when we tried out GraphQL and decided that we should build a GraphQL platform with .NET.

We have invested a lot of free time into this project ...


 The _ChilliCream_ GraphQL platform will add a lo

While until now you could only see fragments of what we are building with todays preview 1 of _Banana Cake Pop_ we will start releasing previews of the wider GraphQL platform that we are working on.

<!--truncate-->

## Banana Cake Pop

Since day one we really were missing a GraphQL IDE that feels good to use, looks beautiful and can deal with large schemas without collapsing.

In order to close this gap we are now starting with preview releases of our new GraphQL IDE _Banana Cake Pop_.

To be clear here, the release today is just the first real preview. We have a ton of features that will come in before we sign of version 1.

.....


## Visual Studio Integration

But we never really just wanted to build a GraphQL IDE, our second goal on this front is taking what _Banana Cake Pop_ is and integrating it into _Visual Studio_. The _Visual Studio_ will go beyond what the standalone IDE can do by allowing you to add complex GraphQL clients with two clicks to your C# projects giving you all the power of strongly typed C# GraphQL clients. This will completely get rid of any magic strings in combination with HTTP clients.

## Strawberry Shake


## Schema Registry

The schema registry will be the central service in your backend that keeps track of schema and query changes in your environment. 

Track which parts of your schema are used and which part of your schemas can be deprecated or removed with out the risk of disrupting your services. 

The schema registry will be fed with analytics data so that you can immediately see what resolvers are performing well or what resolvers are problematic. Moreover it will be tightly coupled with the visual studio integration so that we can already tell you which code change will cause clients to break before you even committed your code. 

Also we will let you explore with visual studio how your schema is composed with _Hot Chocolate_ schema stitching from micro services that power it. How does your data flow and how is the query engine optimizing fetches.

## Query Execution Plans









If you want to get into contact with us head over to our [slack channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) and join our community.

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

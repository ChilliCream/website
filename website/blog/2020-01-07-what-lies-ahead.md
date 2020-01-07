---
title: The state of GraphQL on the .NET Platform
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

For years now ww .NET developers have looked a little envious to the JavaScript platform in regards to GraphQL. All the cool tools and libraries where there. .NET just could not live up to what was available in the JavaScrip real.

This is why we started our work on the _Hot Chocolate_ server. We wanted to bring something of these awesome ideas that we could see on other platforms in regard to GraphQL home .NET.

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

The schema registry will be the central service in your backend that keeps track of schema and query changes in your environment. Track which parts of your schema are used and which part of your schemas can be deprecated or removed with out the risk of disrupting your services. The schema registry will be closely couples with analytics data so that you can immediately see what resolvers are performing well or what resolvers are causing performance issues. The schema registry will be tightly coupled with the visual studio integration so that we can already tell you which code change will cause which client to break. Also we will point you to slow performing resolvers.

Also we will let you explore with visual studio and the schema registry how your schema is composed with _Hot Chocolate_ schema stitching from micro services that power it.

## Query Execution Plans









If you want to get into contact with us head over to our [slack channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) and join our community.

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

---
title: Building a real-time .NET GraphQL Client API
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

![Strawberry Shake](/img/blog/strawberry-shake-banner.svg)

We are busy, busy, busy working on version 11 of _Hot Chocolate_ and _Strawberry Shake_.

In this post I want to explore the client side of GraphQL on .NET more with a special emphasis on subscriptions.

Since, with the new version of _Strawberry Shake_ our initial blog has become kind of invalid I also will walk you trough the basics again before heading into subscriptions and what lies beyond.

<!--truncate-->

## Getting Started

Let us have a look at how we want to tackle things with _Strawberry Shake_. For this little walkthrough I will use our [_Star Wars_ server example](https://github.com/ChilliCream/hotchocolate/tree/master/examples/AspNetCore.StarWars).

If you want to follow along then install the [.NET Core 3 SDK](https://dotnet.microsoft.com/download/dotnet-core/3.0) . We are also supporting other .NET variants but for this example you will need the .NET Core 3 SDK.

Before we can start let us clone the _Hot Chocolate_ repository and start our _Star Wars_ server.

```bash
git clone https://github.com/ChilliCream/hotchocolate.git
cd hotchocolate
dotnet run --project examples/AspNetCore.StarWars/
```

Now that we have our _Star Wars_ server running, lets create a folder for our client and install the _Strawberry Shake_ CLI tools.
The _Strawberry Shake_ CLI tools are optional but make initializing the client project much easier.

```bash
mkdir berry
dotnet new tool-manifest
dotnet tool install StrawberryShake.Tools --version 11.0.0-preview.58 --local
```

In our example we are using the new .NET CLI local tools. `dotnet new tool-manifest` creates the tools manifest which basically is like a packages.config and holds the information of which tools in which version we are using.

The next command `dotnet tool install StrawberryShake.Tools --version 11.0.0-preview.58 --local` installs our _Strawberry Shake_ tools. Once we have a final release of _Strawberry Shake_ you do not need to speciefy the version anymore.

Next we need a little project. Let’s create a new console application so that we can easily run and debug what we are doing.

```bash
dotnet new console -n BerryClient
cd BerryClient
dotnet add package StrawberryShake --version 11.0.0-preview.58
dotnet add package Microsoft.Extensions.Http --version 3.0.0
dotnet add package Microsoft.Extensions.DependencyInjection --version 3.0.0
```

OK, now that we have a project setup lets initialize the project by creating a local schema. Like with _relay_ we are holding a local schema file that can be extended with local types and fields. Our _Graphql_ compiler will use this schema information to validate the queries.

> For the next step ensure that the _Star Wars_ _GraphQL_ server is running since we will fetch the schema from the server.

> If you want to check out what commands are available with the tools just run `dotnet graphql` and the CLI tools will output the available commands.

```bash
dotnet graphql init http://localhost:5000/graphql -n StarWars -p ./StarWars
```

The init command will download the schema as GraphQL SDL and create a config to re-fetch the schema. Also, the config contains the client name. The client name defines how the client class and interface is named.

> Note: You can pass in the token and scheme if your endpoint is authenticated. There is also an update command to update the local schema.

The configuration will look like the following:

```json
{
  "Schemas": [
    {
      "Name": "StarWars",
      "Type": "http",
      "File": "StarWars.graphql",
      "Url": "http://localhost:5000/graphql"
    }
  ],
  "ClientName": "StarWarsClient"
}
```

OK, now let’s get started by creating our first client API. For this open your editor of choice. I can recommend using _VSCode_ for this at the moment since you will get GraphQL highlighting. As we move forward, we will refine the tooling more and provide proper IntelliSense.

Now let us create a new file in our `StarWars` folder called `Queries.graphql` and add the following query:

> The file does not necessarily have to be called queries. You can call it however you want. The GraphQL compiler will figure out what files contain queries and what contain schema definitions.

```graphql
query getFoo {
  foo
}
```

Now build your project.

```bash
dotnet build
```

When we now compile, we get an _MSBuild_ error on which we can click in _VSCode_ and we are pointed to the place in our query file from which the error stems from. The error tells us that there is no field `foo` on the `Query` type.

```bash
/Users/michael/Local/play/berry/BerryClient/StarWars/Queries.graphql(2,3): error GQL: The field `foo` does not exist on the type `Query`. [/Users/michael/Local/play/berry/BerryClient/BerryClient.csproj]
```

Your GraphQL query document is not just a string, it properly compiles and is fully typed. Let's change our query to the following and compile again:

```graphql
query getFoo {
  hero {
    name
  }
}
```

```bash
dotnet build
```

Now our project changes and we get a new `Generated` folder that has all the types that we need to communicate with our backend.

Let us have a look at our client interface for a minute.

```csharp
public interface IStarWarsClient
{
    Task<IOperationResult<IGetFoo>> GetFooAsync(
        CancellationToken cancellationToken = default);
}
```

Let us reflect on that. The query document can hold multiple named operations. In essence the query document describes the interface between the client and the server. Each named operation will become one method in your client that will execute that exact operation on the server.

```graphql
query function_a {
  ...
}

query function_b {
  ...
}

query function_c {
  ...
}
```

Since, with GraphQL you essentially design your own service API by writing a query document your types can become quite messy very quickly.

In order to **AVOID** getting a messy API and to give you control over how your C# API will look like we are using fragments to infer types.

Let us redesign our query with fragments and make it a bit more complex.

```graphql
query getHero {
  hero {
    ...SomeDroid
    ...SomeHuman
  }
}

fragment SomeHuman on Human {
  ...HasName
  homePlanet
}

fragment SomeDroid on Droid {
  ...HasName
  primaryFunction
}

fragment HasName on Character {
  name
}
```

The fragments will yield in the following type structure:

```csharp
public interface ISomeHuman
    : IHasName
{
    string HomePlanet { get; }
}

public interface ISomeDroid
    : IHasName
{
    string PrimaryFunction { get; }
}

public interface IHasName
{
    string Name { get; }
}
```

> We are currently looking into how we can aggregate data and flatten the type structure. We initially thought about introducing some directives to flatten the type structure. But as we thought further on that we really felt we want to have something like [lodash](https://github.com/APIs-guru/graphql-lodash). We are still discussing on what we do here. So stay tuned.

Let's make one more tweak to our query and then we get this example running.

```graphql
query getHero($episode: Episode) {
  hero(episode: $episode) {
    ...SomeDroid
    ...SomeHuman
  }
}

fragment SomeHuman on Human {
  ...HasName
  homePlanet
}

fragment SomeDroid on Droid {
  ...HasName
  primaryFunction
}

fragment HasName on Character {
  name
}
```

By defining a variable with our operation we now can pass in arguments into our operation.

```csharp
public interface IStarWarsClient
{
    Task<IOperationResult<IGetHero>> GetHeroAsync(
        Optional<Episode> episode = default,
        CancellationToken cancellationToken = default);
}
```

OK, let's get it running and then go into more details.

By default the generator will also generate dependency injection code for `Microsoft.Extensions.DependencyInjection`.

In order to get our client up and running we just have to set up a dependency injection container.

> Note: You can shut of dependency injection generation with a _MSBuild_ property. The client can also be instantiated with a builder or by using a different dependency injection container.

Replace you `Program` class with the following code.

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddHttpClient(
            "StarWarsClient",
            c => c.BaseAddress = new Uri("http://localhost:5000/graphql"));
        serviceCollection.AddStarWarsClient();

        IServiceProvider services = serviceCollection.BuildServiceProvider();
        IStarWarsClient client = services.GetRequiredService<IStarWarsClient>();

        IOperationResult<IGetHero> result = await client.GetHeroAsync(Episode.Newhope);
        Console.WriteLine(((ISomeDroid)result.Data.Hero).Name);

        result = await client.GetHeroAsync(Episode.Empire);
        Console.WriteLine(((ISomeHuman)result.Data.Hero).Name);
    }
}
```

Run the console and it will output the following;

```bash
R2-D2
Luke Skywalker
```

## Renaming Type Elements

Did you notice the enum type `Episode.Newhope` in the upper example. This really is not nice to see as a C# developer :). Since the generator is built on top of the stitching API we easily can amend things like that in order to make our client API nice to use.

So, before we go in subscription let`s fix it :)

First, add another GraphQL file and call it `StarWars.Extensions.graphql`. Again, the name does not really matter, you could call it `Foo.graphql` and we would also handle it correctly.

No add the following to the GraphQL file:

```graphql
extend enum Episode {
  NEWHOPE @name(value: "NewHope")
}
```

Rebuild your project and voila ... `Episode.NewHope` is now correctly cased.

The nice thing is that we are just describing what we want to change in this schema extension file, so every time you update the server schema, we will preserve this file and reapply the type extensions to the newly downloaded schema.

## Subscriptions

OK, OK, most of this was already in place, so let us have a look at something more challenging like subscriptions.

Subscriptions will need a state-full connection to a server through a WebSocket. There are other ways to do this like SignalR (which essentially is a socket abstraction) or gRPC or even standard TCP sockets.

While we are in the works to get SignalR and gRPC in let us have a look at how we can do it through WebSockets.

When we started on this we found that WebSockets should be as easy as setting up the HttpClient nowadays. So, we have introduced a `IWebSocketClientFactory`. But just having a factory is not enough since we want to maybe pool socket connections and reuse those with multiple subscriptions.

With the solution that we are introducing with version 11.0.0-preview.58 we are making WebSockets super simple to setup, and we will do all the hard parts like reusing the connection and things like that without you ever noticing it.

Let us have a look at how we can get subscriptions to work.

The first thing we have to do is going back to our query file. The _Star Wars_ server has one subscription that is raised whenever a review is written. So, let’s use it and add it to our query file.

```graphql
query getHero($episode: Episode!) {
  hero(episode: $episode) {
    ...SomeDroid
    ...SomeHuman
  }
}

subscription onReviewCreated(episode: $episode) {
  onReview(episode: $episode) {
    commentary
    stars
  }
}

fragment SomeHuman on Human {
  ...HasName
  homePlanet
}

fragment SomeDroid on Droid {
  ...HasName
  primaryFunction
}

fragment HasName on Character {
  name
}
```

Now, lets rebuild our project and the look at the client interface.

```csharp
public interface IStarWarsClient
{
    Task<IOperationResult<IGetHero>> GetHeroAsync(
        Optional<Episode> episode = default,
        CancellationToken cancellationToken = default);

    Task<IResponseStream<IOnReviewCreated>> OnReviewCreatedAsync(
        Optional<Episode> episode = default,
        CancellationToken cancellationToken = default);
}
```

Our client has now a new method that returns a response stream. A response stream is essentially an `IAsyncEnumerable` that will loop over the subscription event stream.

Now let us put everything together. First we need to configure the WebSocket client connection.

```csharp
services.AddWebSocketClient(
    "StarWarsClient",
    c => c.Uri = new Uri("ws://localhost:5000/graphql"));
```

This kind of looks exactly the way we would configure an HttpClient and it hides all the complex logic about connecting and pooling WebSocket connections. It also lets you easily intercept the connect process to include authentication logic.

The next thing we need to do is to read from our event stream.

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddHttpClient(
            "StarWarsClient",
            c => c.BaseAddress = new Uri("http://localhost:5000/graphql"));
        serviceCollection.AddStarWarsClient();

        IServiceProvider services = serviceCollection.BuildServiceProvider();
        IStarWarsClient client = services.GetRequiredService<IStarWarsClient>();

        var stream = await client.OnReviewCreatedAsync(Episode.NewHope);

        await foreach (var result in stream)
        {
            result.EnsureNoErrors();
            Console.WriteLine(result.Data!.OnReview.Commentary);
        }
    }
}
```

If you look at the code above it looks so easy how you can use subscription with _Strawberry Shake_, it almost looks no different from fetching a simple query with the `HttpClient`. This is exactly what we want the experience to be, simple but when you want to get into the pluming then we will allow you to easily intercept and extend the whole pipeline.

## Custom Scalars

The mean thing with all these examples is that I am mostly using the _Star Wars_ example. The _Star Wars_ uses no custom scalars and is super simple to use. That is the reason why I like to use it for demos, because people get easily aboard with it. But it is also frustrating when you want to go deeper. This is especially true with custom scalars. _Strawberry Shake_ supports an array of scalars that go beyond the GraphQL Spec. But still if you download the GitHub schema for instance you will get a ton of custom scalars.

With the current version we have made dealing with custom scalars a lot easier. First, if we do not know a scalar, then we will treat it as a `String`. While this is not always what you want, it lets you get started quickly and then change things when you really need to.

Let us have a look at how we can bring in a custom scalar. For this example, let us assume we have a scalar called `ByteArray`. This scalar serializes a `System.Byte[]` to a base64 string. This is easy enough. So on the client side we want the generator to generate models that expose `System.Byte[]` as property type. But in the communication between server and client the type is serialized as base64 string.

So, in order to give the generator a hint about these things we need to extend the schema. So, we would need to create a GraphQL file that holds our schema extensions (basically like with the enum example, where e renamed the enum value). The same way we can extend enums we can extend other types. In this case we want to annotate a scalar type.

```graphql
extend scalar ByteArray
  @runtimeType(name: "System.Byte[]")
  @serializationType(name: "System.String")
```

The above example declares that the runtime type (the type that is used in the c# models) shall be a `System.Byte[]` and that the serialization type (the type which client and server use to send the data) shall be a `System.String`. For the generator that is enough to generate everything accordingly.

We still have to implement an `IValueSerializer` to specify the logic how the type shall serialize.

```csharp
public class ByteArrayValueSerializer
    : ValueSerializerBase<byte[], string>
{
    public override string Name => "ByteArray";

    public override ValueKind Kind => ValueKind.String;

    public override object? Serialize(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is byte[] b)
        {
            return Convert.ToBase64String(b);
        }

        throw new ArgumentException(
            "The specified value is of an invalid type. " +
            $"{ClrType.FullName} was expeceted.");
    }

    public override object? Deserialize(object? serialized)
    {
        if (serialized is null)
        {
            return null;
        }

        if (serialized is string s)
        {
            return Convert.FromBase64String(s);
        }

        throw new ArgumentException(
            "The specified value is of an invalid type. " +
            $"{SerializationType.FullName} was expeceted.");
    }
}
```

The serializer can be added as a singleton and will be automatically integrated by the generated client.

```csharp
services.AddSingleton<IValueSerializer, ByteArrayValueSerializer>();
```

> We are refining how those serializers are registered. This is important for cases where one wants to have multiple clients with different kinds of serializers. I know this is rare but still this should work. The coming versions of _Strawberry Shake_ will fine tune this.

## Digging Deeper

Apart from being able to add custom scalars we might want to dig deeper and allow new scenarios with our client like persisted queries. It is needles to say that we will add persisted query support out of the box. But it is also a good example to use to show how we can enable advance server / client protocols with _Strawberry Shake_.

The way we build in things like that is by providing a operation middleware. This basically works like the query middleware in the server on the request level.

_Strawberry Shake_ allows it to swap out the default operation execution pipeline and add your own custom operation execution pipeline.

In order to setup a custom operation execution pipeline you can use for instance the `HttpPipelineBuilder`. Each transport has it`s own transport specific pipeline.

```csharp
serviceCollection.AddSingleton<OperationDelegate>(
    sp => HttpPipelineBuilder.New()
        .Use<CreateStandardRequestMiddleware>()
        .Use<CustomMiddleware>()
        .Use<SendHttpRequestMiddleware>()
        .Use<ParseSingleResultMiddleware>()
        .Build(sp));
```

```csharp
public class CustomMiddleware
{
    private readonly OperationDelegate _next;
    private readonly IOperationSerializer _service;

    public CustomMiddleware(
        OperationDelegate next,
        ISomeCustomService service)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    public async Task InvokeAsync(IHttpOperationContext context)
    {
        // the custom middleware code
        await _next(context);
    }
}
```

## Generation Options

By default _Strawberry Shake_ generates dependency injection code for `Microsoft.Extensions.DependencyInjection` this can be switched of by adding the following `MSBuild` property `<GraphQLEnableDI>false</GraphQLEnableDI>`.

The generator will automatically detect if you are using C# 8.0 with nullables reference types or if you are using an older version of C#.

You can use the following `MSBuild` properties to control this.

```xml
<PropertyGroup>
  <LangVersion>8.0</LangVersion>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

We also by default take the root namespace from the project for generating files. You can however override this by providing the `<BerryNamespace />` property. However, we will change this to an item group soon in order to also enable multiple clients in a single project.

```xml
<PropertyGroup>
  <BerryNamespace>$(RootNamespace)</BerryNamespace>
</PropertyGroup>
```

## Dependency Injection

The client API can be used with other dependency injection container and also without dependency injection at all.

We initially had a limited builder API for this but decided to give it a do over. So, at the moment you could look at the generated dependency injection code and build your own integration.

We will allow with future build to add custom generators that can provide additional code for custom use cases. The way that would work is that such a generator would sit in a NuGet package that is being added to the project. The custom generator would register its generators to a item group and _Strawberry Shake_ would pick those up and integrate them. These custom generators however are somewhere in the version 12 time frame.

## Roadmap

What are our next steps on _Strawberry Shake_ and when are we planning to release it?

We have some more ground to cover before we have version 1 complete.

1. MSBuild Integration
   We are working on making the _MSBuild_ integration better. There are still instances with _VSCode_ where you have to compile twice. This is OK for a preview, but we are on it and think that in the next view preview builds we will have this fixed. With _Visual Studio for Windows_ you can already enjoy design time code generation. This means that when you save a GraphQL file the generator will update the C# files.

1. Tooling
   We are heavy at work on _Bananacake Pop_ which is our GraphQL IDE that will help you write and analyze GraphQL queries.
   We plan to use what we have done for _Bananacake Pop_ to create a nice integration with _VSCode_. We want to have a rich integration with which you can work on huge schemas.

   Beyond _VSCode_ we are looking at writing a nice integration with _Visual Studio for Windows_ and _Visual Studio for MacOS_ that will make _Strawberry Shake_ and _GraphQL_ a first-class citizen in the Microsoft ecosystem.

   We hope to deliver all of this in the version 11 timeframe.

1. Persisted Query Support
   Persisted queries are one of our very next features that we will add to the client. We want to allow the same flows that we support on the server side.

1. Batching Support
   Batching support with the `@export` directive is as well planned for the initial release of _Strawberry Shake_.

1. Code Generation
   The current code generation produces quite nice code, but it can produce issues where the types from your own project collide with the code generation. With the next view builds we will add an option to use full type names in those cases.
   Also, we will add the code generation attribute to the generated files.

1. Defer / Stream
   We are planning to add support for defer and stream to the client. This feature depends on our server implementation so we will have to see how far we are on execution plans before we can start on it.

If you want to get into contact with us head over to our [slack channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) and join our community.

| [HotChocolate Slack Channel](https://join.slack.com/t/hotchocolategraphql/shared_invite/enQtNTA4NjA0ODYwOTQ0LTViMzA2MTM4OWYwYjIxYzViYmM0YmZhYjdiNzBjOTg2ZmU1YmMwNDZiYjUyZWZlMzNiMTk1OWUxNWZhMzQwY2Q) | [Hot Chocolate Documentation](https://hotchocolate.io) | [Hot Chocolate on GitHub](https://github.com/ChilliCream/hotchocolate) |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |


[hot chocolate]: https://hotchocolate.io
[hot chocolate source code]: https://github.com/ChilliCream/hotchocolate

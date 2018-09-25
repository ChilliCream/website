---
title: Executable Directives
author: Michael Staib
authorURL: https://github.com/michaelstaib
authorImageURL: https://avatars1.githubusercontent.com/u/9714350?s=100&v=4
---

With version 0.5.0 we are introducing executable directives.

<!--truncate-->

| Location               | OnBeforeInvoke | OnInvoke | OnAfterInvoke |
| ---------------------- | -------------- | -------- | ------------- |
| QUERY                  |                |          |               |
| MUTATION               |                |          |               |
| SUBSCRIPTION           |                |          |               |
| FIELD                  | X              | X        | X             |
| FRAGMENT_DEFINITION    |                |          |               |
| FRAGMENT_SPREAD        |                |          |               |
| INLINE_FRAGMENT        |                |          |               |
| SCHEMA                 | X              | X        | X             |
| SCALAR                 |                |          |               |
| OBJECT                 | X              | X        | X             |
| FIELD_DEFINITION       | X              | X        | X             |
| ARGUMENT_DEFINITION    | X              |          |               |
| INTERFACE              | X              | X        | X             |
| UNION                  |                |          |               |
| ENUM                   |                |          |               |
| ENUM_VALUE             |                |          |               |
| INPUT_OBJECT           |                |          |               |
| INPUT_FIELD_DEFINITION |                |          |               |

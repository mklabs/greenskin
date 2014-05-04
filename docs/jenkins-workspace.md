
## Jenkins workspace

Or job workspace (case not executing through jenkins)

General thougths on workspace structure, files generated, etc.

### Build.json

Thinking of abstracting worskpace handling (in the webapp) using a set
of convention-based generated files.

The system would request / require the top level files and follow
instructions from there.


Ex.

    - ws/                   -> new JobWorkspace()
      - build.json
      - results/
        - 1/
        - ...
        - 99/               -> new BuildWorkspace()
          - build.json
          - ...

The `build.json` file could be something like:

```json
{
  "graphs": "./graphs.json",
  "metrics": "./metrics.json"
}
```

With each key, beeing a known adapter to handle the results in the UI.

For instance, `graphs` would kick off a Build tab with name "graphs",
and pathname `/{ns}/{{ job.name }}/graphs`.

The action responsible of dealing with req / res would be
`routes/graphs`. Can even be seen as a "resource", a bit like
https://github.com/visionmedia/express-resource

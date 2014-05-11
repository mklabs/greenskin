
# Remote scripts

And node ability to exec scripts for stdin.

Examples:

```sh
cat somefile.js | node
```

Though in this case, it is somewhat similar to running `node somefile.js`, except much worse (no argv, etc.)

Or

```sh
curl http://example.com/scripts.js | node
```

is much more interresting. It is really similar to running a remote
shell script by running it through `| sh` (rvm, dotfiles, etc.)

But, in this case, we have a JS execution context and a full node
environment, with a few gotchas.

1. You can't really use `process.argv`. You can, but node defaults
   behavior is to try to load the very first positional argument, like
  `node app.js`

2. You can't really require (your own stuff). The script is executed in
   the context of `process.cwd()` so you can't assume what you can
   require, unless previously stated that `npm install <pkgname>` must be
   run before executing the remote script.

## Stuff

Prefer to

- Use STDERR for logging, STDOUT for meaningful result (for IO
   redirection, ex. `... | node > results.json`

- Use environment variables for any options, `FILE=build.json node`
  instead of `node --file build.json`.

- ..

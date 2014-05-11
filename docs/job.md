

## GS Job

# Build Lifecycle

By default, the job performs the build as following:

1. Run `before_install` commands - Use this to prepare the system to
   install prerequisites or dependencies. e.g. npm update, git pull, etc.
2. Run `install commands` - Use this to install any prerequisites or
   dependencies necessary to run your build
3. Run `before_script` commands - Use this to prepare your build for
   testing e.g. copy database configurations, environment variables, etc.
4. Run test script commands - Default is specific to project language.
  All commands must exit with code 0 on success. Anything else is
  considered failure.
5. Run `after_success` or after_failure commands
6. Run `after_script` commands The outcome of any of these commands
  (except `after_success`, `after_failure` or `after_script`) indicates
  whether or not this build has failed or passed. The standard Unix exit
  code of "0" means the build passed; everything else is treated as
  failure.

Test result is exported to TRAVIS_TEST_RESULT, which you can use in commands run in after_script commands.

With the exception of cloning project repository and changing directory to it, all of the above steps can be tweaked with .travis.yml.


### Build Lifecycle


By default, the job performs the build as following:

1. Run before script

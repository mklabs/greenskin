
Plugins probably a really bad name.

More subapps or simple middlewares.

The idea is to abstract away from job specific implementaiton and add extension hook for any kind of Job.

ex. phantomas or feature for now.


Misc

- Everything should be namespaced: `/p/*` for phantomas, `/f/*` for
  features

- Job sets up basic info on the job type, namely type and now namespace
  props.
  - namespace should be used in templates in the parent app to route to
    proper sub view / actions.


Known routes:

-

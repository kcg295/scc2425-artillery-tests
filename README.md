# Instructions

This repo contains tests for Artillery for the TuKano application. In order to
run these, you will need to:

1. Modify the target in each of the YAML files.
2. Modify the test-utils.js file to modify userId and shortId to id, as
appropriate.
3. Run the user_register.yaml test. This will register 200 users for the test based on a CSV file in the data folder.
4. Run the upload_shorts.yaml test. This will randomly generate shorts and save their details in the shorts folder.
5. Run the realistic_flow.yaml test. This will use both the registered users and the uploaded shorts.
6. Re-run the tests above, altering values as needed. Note that any time you
want to re-run the user_register.yaml test, you must first run the
user_delete.yaml test.

Good luck!

-- Kevin

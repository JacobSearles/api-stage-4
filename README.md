API, Stage 4 - SQL 
======================================

In this stage, you will be changing the backend of your API to use MySQL, and also
you'll be implementing the database layer and API endpoints to create survey questions
and receive and count votes.

Database Layer
--------------

It it generally good practice to keep your API layer separate from your DB layer as much
as possible.  This will allow you to change your DB layer should you plan to use a different
database in the future (perhaps a NoSQL instead of a SQL database).

Towards that end, I have provided units tests in db/db.test.js that will allow
you to test your DB layer separately (that is, before you write your API endpoints).  
You should work on these tests first.
(You can run them with `npx jest db/db.test.js`)
Read the tests to learn the semantics of the functions you must implement.

Although the DB layer as designed is not fully abstracted because it exposes some 
MySQL error codes, it will be good enough for our purposes.

First, you need to complete the `db/createdb.sql` file.  It contains a single table
so far for `users`.  You need to add tables to maintain questions, answer options,
and votes.

The E/R diagram is shown below:

```
   +----------+
   |   user   |
   +----------+\
                \   M:N
               /----------\
               |   vote   |----------------
              /\----------/                \
             /                1:M           \
   +--------------+    /------------\    +------------------+
   |   question   |--- | belongs to |----|   answerchoice   |
   +--------------+    \------------/    +------------------+

```

Ordinarily, this E/R diagram would result in 5 tables/relations.  However, the relations
'belongs to' and 'answerchoice' can be combined into one (for more general rules,
see [Dr. Prakash slides 17-19](http://courses.cs.vt.edu/~cs4604/Fall18/lectures/lecture-7.pdf))

The entities have the following attributes:

+ user:   username, password, firstname, lastname, email, admin, id
    - username - short username. Note that I changed 'name' to 'username' for
        consistency, compared to previous stages.
    - password - encrypted password
    - firstname
    - lastname
    - email 
    - id
    - admin - flag whether user has admin privileges

+ question:     question, description, type, id
    - id - the question's id
    - question - the question text itself
    - description - a description to go with it
    - type    - for future extensibility.  For now, let's set type to 1.  In the future,
              type 2 could signal a question that allows more than one selection.

+ answerchoice:     questionid, description, position, id
    - description - the description of the choice (e.g. "Red")
    - questionid - the id of the question to which this choice belongs
                (this attribute expresses the 1:M belongs_to relationship)
    - position - a number that denotes the relative position of this choice within 
                 its question

+ vote: answerchoiceid, questionid, userid
    - answerchoiceid - the id of the answerchoice to which this vote refers
    - userid - the id of the user who cast the vote
    - questionid - the id of the question to which the vote belongs

Your task is to design the tables for each of these relations, choosing [suitable
types](https://dev.mysql.com/doc/refman/5.7/en/data-types.html) and constraints.  
Specifically, your scheme should enforce the following constraints:

- email addresses should be unique
- usernames addresses should be unique
- there can be at most one answerchoice for each position in a question
- the questionid attribute in answerchoice must refer to an existing question
- the userid attribute in vote must refer to an existing user
- the answerchoiceid attribute in vote must refer to an existing answer choice
- the questionid attribute in vote must refer to an existing question
- the combination of (questionid, answerchoiceid) in vote must refer to an existing
  entry (questionid, id) in the answerchoice relation
- in order to later accommodate type 2 questions, there should be at most one vote 
  for each combination of user, question, and answeroption.

You should use appropriate [foreign key constraints](https://dev.mysql.com/doc/refman/5.7/en/create-table-foreign-keys.html) to ensure these conditions.
The idea is that your database should express the intent of your model - let the
database help you in detecting whether your API is about to violate them.

You can use phpmyadmin or similar tools to build your database scheme, then extract
the resulting sql from a database dump (see [mysqldump](https://dev.mysql.com/doc/refman/5.7/en/mysqldump-sql-format.html)).

I have provided some starter code for the database showing how to use the `mysql`
driver npm package.  Since the package by itself is low-level and does not provide
support for promises, I have created a small adapter that provides promisified versions
of some methods.  

API Layer:
----------

The API layer must support the same operations as in stage 3 for the creation 
and management of users.  Except for the new DB layer, most code should carry over.
(Note that I corrected the inconsistency wrt name/username - the property is now
called username throughout.  Also, users now have firstname/lastname/email instead
of fullname.)

For voting and totaling of votes, the provided tests expect certain API endpoints.
You may implement additional endpoints and/or options.  For instance, the API endpoint
for voting is POSTing to `/api/question/:id/vote`. When a user votes, it's likely that
the frontend will want a count of votes in return.  To avoid additional roundtrips,
you could send that back with the vote.
Or you could implement an option GET `/api/question/:id?includevotes=1` to retrieve
a question along with perhaps the current user's vote and/or a vote total.

The access control model is such that the API endpoints require the following
authentication:

- POST /api/question    - create a new question - must be administrator
- PUT /api/question/:id - update an existing question - must be administrator
- GET /api/question/:id - retrieve a question's content - must be logged in
- GET /api/question - retrieve a list of all questions.  Uses paging.
- POST /api/question/:id/vote - vote on a question - must be logged in
- GET /api/question/:id/vote - get the vote total - must be logged in.
- GET /api/question/:id/vote?user=`id` - retrieve user id's vote.  Only the
                    administrator or the user who cast the vote can retrieve
                    the vote.
Paging
------

A common technique to deal with large lists of data in an API is via paging.
A page is a range of results.  For instance, for page size 10, page 0 would
contain results 1-10, page 1 would contain results 11-20, and so on.
The GET `/api/question` and GET `/api/users` API endpoints now should support
paging via a query parameter.  For instance, GET `/api/users?page=1` should
retrieve users 11-20.

Setup:
------

For the assignment, you should first fork the project on git.cs.vt.edu, then set
your fork to be private, then clone your fork onto your machine.
If you're in doubt about any of these steps, ask!

The provided repository contains the unit tests, you will need to bring in files
from your stage-3 repository, specifically the `auth.js` and `users.js` files in the
`api/` directory.

You need to be able to reach a mysql server via the configuration listed
in `config/test.json` (for testing) and `config/default.json` (for running)
You need to create (at least) 2 databases and set up a user that can access
them.
If you're working in an environment that support MySQL locally, you can install
mysql locally and develop locally. Or, you can use your cloud instance for this purpose.


Submission
-----------

You will be submitting the entire project directory, but you may
not make changes to the tests file we provide.  To submit, please commit your
changes to your clone, push them to your fork on git.cs.vt.edu, then use the
zip file download feature on git.cs.vt.edu to prepare a zip file for submission.


-- created by gback Mar 2019

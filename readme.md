# POC Postgres with replica


start:

```shell
docker-compose build
docker-compose up

```

Then you should have:

| Service   | Address       | Description                                |
|-----------|---------------|--------------------------------------------|
| db-master | 10.0.0.2      | PostgreSQL master database                 |
| db-replica| 10.0.0.3      | PostgreSQL replica database with db-master |
| app       | localhost:3000| Simple Node.js Express API                 |
| pgAdmin   | localhost:5050| pgAdmin (useful if you don't have a SQL client)  |

Both dbs connections are: 

```shell
USER=postgres
PASSWORD=postgres
DB=APP
PORT=5432
```


If you want to write some data on the db-master you can use the **app**'s API:

```shell
curl --location --request POST 'http://localhost:3000/test' --header 'Content-Type: application/json' --data-raw '{ 
    "data": {
        "bla": "bla bla bla",
        "eh": "ah si..."
    }
}'
```

Then you can read the data from the replica

```shell
curl localhost:3000/test

```


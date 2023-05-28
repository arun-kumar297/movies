const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbToResponseObj = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadId: dbObject.lead_actor,
  };
};
const convertDirectorDBToResponse = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//get api /movies/
app.get("/movies/", async (request, response) => {
  const movieNames = `
    select 
        movie_name
    from movie`;
  const allMovies = await db.all(movieNames);
  response.send(allMovies.map((eachname) => convertDbToResponseObj(eachname)));
});

//post API /movies/
app.post("/movies/", async (request, response) => {
  const newMovieDetails = request.body;
  const { directorId, movieName, leadActor } = newMovieDetails;
  const addMovieQuery = `
  insert into movie (director_id, movie_name, lead_actor)
  values (
      '${directorId}',
      '${movieName}',
      '${leadActor}'
  );`;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

//get API /movies/:movieId/
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `select
        * 
    from
        movie
    where movie_id = ${movieId};`;
  const movieDetail = await db.get(getMovieQuery);
  response.send(convertDbToResponseObj(movieDetail));
});

//put
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `UPDATE
    movie
  SET
    director_id = '${directorId}',
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
  WHERE
    movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//delete
app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `delete from movie
    where movie_id = ${movieId};`;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

//get director details
app.get("/directors/", async (request, response) => {
  const directorDetails = `select
    *
    from director;`;
  const directors = await db.all(directorDetails);
  response.send(directors.map((each) => convertDirectorDBToResponse(each)));
});

//get director based on directorId
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getMovieNames = `select *
    from movie
    where director_id = ${directorId};`;
  const movieName = await db.all(getMovieNames);
  response.send(
    movieName.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;

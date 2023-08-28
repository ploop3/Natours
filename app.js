const fs = require('node:fs');
const express = require('express');

//Will add a bunch of methods to our app variable
const app = express();

app.use(express.json());

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      // tours: tours,
      tours,
    },
  });
});
app.get('/api/v1/tours/:id/:x/:y', (req, res) => {
  console.log(req.params);
  res.status(200).json({
    status: 'success',
    // results: tours.length,
    // data: {
    //   // tours: tours,
    //   tours,
    // },
  });
});

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
});

//an important method is .listen() to start the sever
const port = 3000;
app.listen(port, () => {
  console.log(`App running on http://127.0.0.1:${port}`);
});

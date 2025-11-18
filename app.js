const cors = require("cors");
const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.get("/best-time/:category", (req, res) => {
  const category = req.params.category;

  fs.readFile("files/best-time.txt", "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading best-time.txt: ", err);
      return res.status(500).send("Can't read file.");
    }

    const lines = data.split("\n");
    lines.forEach((line) => {
      if (line.split("~")[0] === category) {
        res.status(200).send(line);
      }
    });
  });
});

app.get("/set-best-time/:category/:time", (req, res) => {
  const category = req.params.category;
  const newTime = req.params.time.split(":");

  if (!category || !newTime) {
    return res.status(400).send("No request body content.");
  }

  fs.readFile("files/best-time.txt", "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading best-time.txt: ", err);
      return res.status(500).send("Can't read file.");
    }

    const lines = data.split("\n");
    let idx = -1;
    lines.forEach((line, index) => {
      const splitLine = line.split("~");
      if (splitLine[0] === category) {
        const currTime = splitLine[1].split(":");
        if (
          newTime[0] < currTime[0] ||
          (newTime[0] === currTime[0] && newTime[1] < currTime[1]) ||
          (newTime[0] === currTime[0] &&
            newTime[1] === currTime[1] &&
            newTime[2] < currTime[2])
        ) {
          idx = index;
        }
      }
    });

    if (idx !== -1) {
      lines[idx] = `${category}~${newTime[0]}:${newTime[1]}:${newTime[2]}`;

      fs.writeFile("files/best-time.txt", lines.join("\n"), "utf-8", (err) => {
        if (err) {
          console.error("Error writing to best-time.txt: ", err);
          return res.status(500).send("Can't write to file.");
        }
        res.status(201).send("Updated best-time.txt");
      });

      transporter.sendMail({
        from: "time@geoffhuntsgood.com",
        to: "geoffhuntsgood@gmail.com",
        subject: "Pokelist Best Times Updated",
        text: data,
      });
    } else {
      res.status(200).send("Time not beaten, best-times not updated.");
    }
  });
});

app.listen(3000, () => {
  console.log("Express up at port 3000");
});

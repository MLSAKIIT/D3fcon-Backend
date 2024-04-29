const express = require("express");
require("dotenv").config();
const cors = require("cors");
const connectDb = require("./db/connect");
const User = require("./models/User");
const Player = require("./models/Player");
const Question = require("./models/Question");
const authRouter = require("./routes/authRouter");
const submitRouter = require("./routes/submitRouter");
const http = require("http");
const cookieParser = require("cookie-parser");
const { startPlayerWatcher } = require("./watchers/user-watcher");
const { startSocketIO } = require("./sockets/socketio");
const { getLeaderBoard } = require("./controllers/leader-board");
const authenticate = require("./middlewares/authenticate");

const PORT = 3001 || process.env.PORT;
const app = express();
const serverHttp = http.createServer(app);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/submit/", authenticate, submitRouter);

//----------------Development Endpoints--------------------------------//

//Get a player
app.get("/player", authenticate, async (req, res) => {
  try {
    const { id } = req.player;
    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.status(200).json({
      userName: player.userName,
      level: player.level,
      currentQuestion: player.currentQuest,
      isStorySeen: player.isStorySeen,
      score: player.score,
    });
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});
//Get all users
app.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    console.log(users);
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

//Create a user
app.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to push a Question
app.post("/question", async (req, res) => {
  try {
    const question = await Question.create(req.body);

    res.status(201).json(question);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//seenStatus update
app.post("/seenstatus", authenticate, async (req, res) => {
  try {
    const { id } = req.player;
    const player = await Player.updateOne({ _id: id }, { isStorySeen: true });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.status(200).json({ message: "Story seen status updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Event Satus update
app.post("/update", async (req, res) => {
  try {
    const users = await User.find({});
    users.forEach(async (user) => {
      await User.updateOne({ _id: user._id }, { isEventAttended: false });
    });
    res.status(200).json({ message: "Updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
//----------------Development Endpoints End--------------------------------//
const server = async () => {
  try {
    await connectDb(process.env.DATABASE_URL);
    const io = startSocketIO(serverHttp);
    global.leaderboardData = await getLeaderBoard();
    await startPlayerWatcher(io);

    serverHttp.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};
server();

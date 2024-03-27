require("dotenv").config();
const Player = require("../models/Player");
const Question = require("../models/Question");

const submitQuest = async (req, res) => {
  try {
    const { answer } = req.body;
    const { id } = req.player;
    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentQuest = player.currentQuest;

    const question = await Question.findOne({ questionNo: currentQuest });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const correctAnswer = question.answer;

    if (answer !== correctAnswer) {
      return res.status(400).json({ message: "Incorrect Answer" });
    }

    updatedQuestion = await Question.findByIdAndUpdate(
      question._id,
      { $push: { submittedBy: id } },
      { new: true }

      // push the id to submittedBy array
    );

    const playerIndex = updatedQuestion.submittedBy.length;
    let newScore = 0;
    let score = player.score;
    if (playerIndex < 10) {
      newScore = 1000 - playerIndex * 20;
      await Player.updateOne({ _id: id }, { $inc: { score: newScore } });
    } else {
      newScore = 820 - playerIndex * 2;
      await Player.updateOne({ _id: id }, { $inc: { score: newScore } });
    }

    await Player.updateOne(
      { _id: id },
      { currentQuest: currentQuest + 1 },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "Correct Answer", score: score + newScore });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { submitQuest };

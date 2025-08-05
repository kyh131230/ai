const classNames = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
  "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter",
  "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
  "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase",
  "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
  "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
  "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
  "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
  "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
  "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
  "scissors", "teddy bear", "hair drier", "toothbrush"
];

function drawBoxes(output, ctx, canvasWidth, canvasHeight) {
  const numDetections = output.length / 6;

  for (let i = 0; i < numDetections; i++) {
    const x1 = output[i * 6];
    const y1 = output[i * 6 + 1];
    const x2 = output[i * 6 + 2];
    const y2 = output[i * 6 + 3];
    const score = output[i * 6 + 4];
    const classId = output[i * 6 + 5];

    if (score > 0.7) {
      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, boxWidth, boxHeight);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "red";
      const label = classNames[Math.floor(classId)] || `class ${classId}`;
      ctx.fillText(`${label} (${score.toFixed(2)})`, x1, y1 > 10 ? y1 - 5 : y1 + 15);
    }
  }
}
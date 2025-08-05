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
  const numDetections = output.length / 85;

  for (let i = 0; i < numDetections; i++) {
    const base = i * 85;
    const scores = output.slice(base + 5, base + 85);
    const maxScore = Math.max(...scores);
    const classId = scores.indexOf(maxScore);

    if (maxScore > 0.5) {  // 신뢰도 필터
      const cx = output[base];
      const cy = output[base + 1];
      const w = output[base + 2];
      const h = output[base + 3];

      const x = (cx - w / 2) * canvasWidth / modelInputSize;
      const y = (cy - h / 2) * canvasHeight / modelInputSize;
      const width = w * canvasWidth / modelInputSize;
      const height = h * canvasHeight / modelInputSize;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText(`${classNames[classId]} (${maxScore.toFixed(2)})`, x, y > 10 ? y - 5 : y + 15);
    }
  }
}
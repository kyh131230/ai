let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let session;

// 카메라 시작
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => { video.srcObject = stream; })
  .catch(err => alert("카메라 접근 오류: " + err));

// ONNX 모델 로드
async function loadModel() {
  session = await onnx.InferenceSession.create("model/yolov8n.onnx");
}

// 추론 실행
async function runDetection() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const inputTensor = preprocess(canvas);
  const outputMap = await session.run({ images: inputTensor });
  const results = postprocess(outputMap, canvas.width, canvas.height);
  drawBoxes(results);
}

// 캡처 버튼
document.getElementById('capture').addEventListener('click', runDetection);

// 초기화
loadModel();
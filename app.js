const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let modelSession = null;
const modelInputSize = 640;
const modelPath = './model/yolov8n.onnx';

function log(msg, color = 'green') {
  status.innerText = msg;
  status.style.color = color;
}

// 📸 카메라 시작
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    log("✅ 카메라 시작됨");
  } catch (err) {
    log("❌ 카메라 접근 오류: " + err.message, 'red');
  }
}

// 🤖 모델 로딩
async function loadModel() {
  try {
    log("🔄 모델 로딩 중...");
    modelSession = await ort.InferenceSession.create(modelPath);
    log("✅ 모델 로딩 완료");
  } catch (err) {
    log("❌ 모델 로딩 실패: " + err.message, 'red');
  }
}

// 🧠 전처리
function preprocess() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(video, 0, 0, modelInputSize, modelInputSize);

  const imageData = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);
  const { data } = imageData;

  const floatData = new Float32Array(modelInputSize * modelInputSize * 3);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = data[i * 4] / 255;
    floatData[i + modelInputSize * modelInputSize] = data[i * 4 + 1] / 255;
    floatData[i + 2 * modelInputSize * modelInputSize] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor('float32', floatData, [1, 3, modelInputSize, modelInputSize]);
}

// 📦 후처리 (생략 가능. 앞서 작성한 postprocess, drawBoxes 함수 사용)

// 📸 버튼 클릭 → 분석 실행
document.getElementById('captureBtn').addEventListener('click', async () => {
  if (!modelSession) {
    log("❌ 모델이 아직 로드되지 않았습니다", 'red');
    return;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    const input = preprocess();
    const outputMap = await modelSession.run({ images: input });
    const results = postprocess(outputMap, canvas.width, canvas.height);
    drawBoxes(results);
    log(`✅ ${results.length}개 객체 감지`);
  } catch (err) {
    log("❌ 추론 오류: " + err.message, 'red');
  }
});

// ✅ 전체 초기화
window.onload = async () => {
  await initCamera();
  await loadModel();
};
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

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;

    // 메타데이터가 완전히 로드될 때까지 기다림
    await new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    // 정확한 video 크기 적용
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    log("✅ 카메라 시작됨");
  } catch (err) {
    log("❌ 카메라 접근 오류: " + err.message, 'red');
  }
}

async function loadModel() {
  try {
    log("🔄 모델 로딩 중...");
    modelSession = await ort.InferenceSession.create(modelPath);
    log("✅ 모델 로딩 완료");
  } catch (err) {
    log("❌ 모델 로딩 실패: " + err.message, 'red');
  }
}

function preprocess() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  const floatData = new Float32Array(3 * modelInputSize * modelInputSize);

  // Resize: 현재 영상 크기를 640x640에 맞춰 임시 캔버스에 resize
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0, modelInputSize, modelInputSize);
  const resizedData = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize).data;

  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = resizedData[i * 4] / 255; // R
    floatData[i + modelInputSize * modelInputSize] = resizedData[i * 4 + 1] / 255; // G
    floatData[i + 2 * modelInputSize * modelInputSize] = resizedData[i * 4 + 2] / 255; // B
  }

  return new ort.Tensor('float32', floatData, [1, 3, modelInputSize, modelInputSize]);
}


document.getElementById('captureBtn').addEventListener('click', async () => {
  if (!modelSession) {
    log("❌ 모델이 아직 로드되지 않았습니다", 'red');
    return;
  }

  // 1️⃣ 실제 영상 프레임 캡처 확인용 로그
  console.log("📸 video.readyState =", video.readyState);  // 0 ~ 4
  console.log("🎞️ video.videoWidth =", video.videoWidth);
  if (video.readyState < 2) {
  log("⚠️ 비디오 프레임이 아직 준비되지 않았습니다", 'orange');
  return;
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

// 디버깅용: 첫 번째 픽셀이 전부 255라면 흰색임
  const imgData = ctx.getImageData(0, 0, 1, 1);
  const [r, g, b] = imgData.data;
  console.log("🎨 첫 픽셀:", r, g, b);

  if (r === 255 && g === 255 && b === 255) {
    log("⚠️ 카메라에서 영상이 안 찍히고 흰 화면입니다", 'orange');
    return;
  }

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

window.onload = async () => {
  await initCamera();
  await loadModel();
};

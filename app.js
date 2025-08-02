let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let session = null;

// 상태 메시지 출력 함수
function log(msg, color = 'green') {
  const status = document.getElementById('status');
  status.innerText = msg;
  status.style.color = color;
}

// 카메라 시작
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => {
    video.srcObject = stream;
    log("✅ 카메라 시작됨");
  })
  .catch(err => {
    log("❌ 카메라 접근 오류: " + err.message, 'red');
  });

// ONNX 모델 로드
async function loadModel() {
  try {
    log("🔄 모델 로딩 중...");
    session = await onnx.InferenceSession.create("model/yolov8n.onnx");
    log("✅ 모델 로딩 완료");
  } catch (err) {
    log("❌ 모델 로딩 실패: " + err.message, 'red');
  }
}

// 추론 실행
async function runDetection() {
  if (!session) {
    log("❌ 모델이 아직 로드되지 않았습니다", 'red');
    return;
  }

  log("🔍 분석 중...");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const inputTensor = preprocess(canvas);
    const outputMap = await session.run({ images: inputTensor });
    const results = postprocess(outputMap, canvas.width, canvas.height);
    drawBoxes(results);

    if (results.length === 0) {
      log("⚠️ 객체 없음");
    } else {
      log(`✅ ${results.length}개 객체 감지`);
    }
  } catch (err) {
    log("❌ 분석 오류: " + err.message, 'red');
  }
}

// 분석 버튼 연결 (ID 이름 주의!)
document.getElementById('capture').addEventListener('click', runDetection);

// 초기화
loadModel();
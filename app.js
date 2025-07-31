
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture');

// 카메라 스트림 요청
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    alert("카메라 접근 불가: " + err);
  });

captureBtn.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = "block";
  alert("이미지 캡처 완료! 이제 분석 로직을 여기에 추가하세요.");
});

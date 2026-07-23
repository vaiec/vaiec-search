const textarea = document.getElementById("searchInput");
const resultDiv = document.getElementById("result");
const resultContainer = document.getElementById("resultContainer");
const submitBtn = document.getElementById("submitBtn");
const heading = document.getElementById("heading");

const copyBtn = document.getElementById("copyBtn");
const voiceBtn = document.getElementById("voiceBtn");

let speaking = false;

async function typeText(container, text, delay = 5) {
  container.textContent = "";

  for (let i = 0; i < text.length; i++) {
    container.textContent += text[i];
    container.parentElement.parentElement.scrollTop = 0;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

async function fetchWikiSummary(query) {
  query = query.trim();

  if (!query) {
    resultContainer.style.display = "none";
    heading.style.display = "block";
    return;
  }

  speechSynthesis.cancel();
  speaking = false;
  voiceBtn.innerHTML = "🔊 Listen";

  heading.style.display = "none";
  resultContainer.style.display = "block";

  resultDiv.scrollTop = 0;
  resultDiv.style.display = "flex";
  resultDiv.style.flexDirection = "column";
  resultDiv.innerHTML = '<em style="color:#888">Thinking...</em>';

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No article found");
    }

    const data = await response.json();

    if (data.type === "disambiguation") {
      resultDiv.innerHTML = `
        <h2>${data.title}</h2>
        <p>This term is ambiguous, please be more specific.</p>
      `;
      resultDiv.scrollTop = 0;
      return;
    }

    if (data.extract) {
      let imgHtml = "";

      if (data.originalimage?.source) {
        imgHtml = `<img src="${data.originalimage.source}" alt="${data.title}">`;
      } else if (data.thumbnail?.source) {
        imgHtml = `<img src="${data.thumbnail.source}" alt="${data.title}">`;
      }

      resultDiv.style.flexDirection = "row";

      resultDiv.innerHTML = `
        <div class="result-text">
          <h2>${data.title}</h2>
          <p></p>
        </div>
        ${imgHtml}
      `;

      const p = resultDiv.querySelector(".result-text p");

      await typeText(p, data.extract, 3);

      resultDiv.scrollTop = 0;
    } else {
      resultDiv.style.flexDirection = "column";
      resultDiv.innerHTML = "<p>No summary available.</p>";
      resultDiv.scrollTop = 0;
    }
  } catch (error) {
    resultDiv.style.flexDirection = "column";
    resultDiv.innerHTML = `
      <p style="color:#ff8080">
        Error: ${error.message}
      </p>
    `;
    resultDiv.scrollTop = 0;
  }
}

copyBtn.onclick = async () => {
  const text =
    resultDiv.querySelector(".result-text p")?.innerText ||
    resultDiv.innerText;

  if (!text.trim()) return;

  try {
    await navigator.clipboard.writeText(text);

    copyBtn.innerHTML = "Copied";

    setTimeout(() => {
      copyBtn.innerHTML = "Copy";
    }, 1500);
  } catch {}
};

voiceBtn.onclick = () => {
  if (speaking) {
    speechSynthesis.cancel();
    speaking = false;
    voiceBtn.innerHTML = "🔊 Listen";
    return;
  }

  const text =
    resultDiv.querySelector(".result-text p")?.innerText ||
    resultDiv.innerText;

  if (!text.trim()) return;

  const speech = new SpeechSynthesisUtterance(text);

  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;

  const voices = speechSynthesis.getVoices();

  const googleVoice = voices.find(v =>
    v.name.toLowerCase().includes("google")
  );

  if (googleVoice) {
    speech.voice = googleVoice;
  }

  speech.onstart = () => {
    speaking = true;
    voiceBtn.innerHTML = "⏹ Stop";
  };

  speech.onend = () => {
    speaking = false;
    voiceBtn.innerHTML = "🔊 Listen";
  };

  speechSynthesis.speak(speech);
};

speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};

textarea.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    fetchWikiSummary(textarea.value);
  }
});

submitBtn.addEventListener("click", () => {
  fetchWikiSummary(textarea.value);
});
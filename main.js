// catch the element using id.
const surahList = document.getElementById("surah-list");
const surahInfo = document.getElementById("surah-info");
const languageList = document.getElementById("language");
const audioPlayer = document.getElementById("audio-player");

// load surah
fetch("https://api.alquran.cloud/v1/surah")
  .then((response) => response.json())
  .then((data) => {
    const surahs = data.data;
    surahs.forEach((surah) => {
      const option = document.createElement("option");
      option.value = surah.number;
      option.text = `${surah.number}. ${surah.englishName} (${surah.englishNameTranslation})`;
      surahList.appendChild(option);
    });
  })
  .catch((error) => {
    console.log(error);
    alert("error 404 not found!");
  });

// Cache for Surah data
const surahCache = {};

// Function to fetch Surah data
const fetchSurahData = async (surahNumber, language) => {
  const cacheKey = `${surahNumber}-${language}`;
  if (surahCache[cacheKey]) {
    return surahCache[cacheKey]; // Return cached data if available
  }

  try {
    // Show loading state
    surahInfo.innerHTML = `<p class="text-sm font-bold sm:text-lg">Loading Surah data...</p>`;

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,en.sahih`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Surah data: ${response.statusText}`);
    }

    const data = await response.json();
    surahCache[cacheKey] = data; // Cache the fetched data
    return data;
  } catch (error) {
    console.error("Error fetching Surah data:", error);
    throw error; // Re-throw the error for handling
  }
};

// Function to update Surah info
const updateSurahInfo = (surah) => {
  const ayahCount = surah.ayahs.length;
  const sujudCount = surah.ayahs.filter((ayah) => ayah.sajda).length;

  surahInfo.innerHTML = `
    <div class="space-y-2">
      <p class="text-sm font-bold sm:text-lg">Surah Name: ${surah.englishName} (${surah.englishNameTranslation})</p>
      <p class="text-sm font-bold sm:text-lg">Revelation Type: ${surah.revelationType}</p>
      <p class="text-sm font-bold sm:text-lg">Number of Ayahs: ${ayahCount}</p>
      <p class="text-sm font-bold sm:text-lg">Number of Sajdah: ${sujudCount}</p>
    </div>
  `;
};

// On window load, set Ayah for first Surah
window.addEventListener("load", async () => {
  languageList.value = "Arabic";

  try {
    const data = await fetchSurahData(1, "Arabic");
    const surah = data.data[0];
    updateSurahInfo(surah);
  } catch (error) {
    surahInfo.innerHTML = `
      <div class="text-red-500 text-sm font-bold sm:text-lg">
        Failed to load Surah data. <button onclick="window.location.reload()" class="text-blue-500 underline">Retry</button>
      </div>
    `;
  }
});

// On Surah change, update Ayah info
surahList.addEventListener("change", async () => {
  const surahNumber = surahList.value;
  const selectedLanguage = languageList.value;

  try {
    const data = await fetchSurahData(surahNumber, selectedLanguage);
    const surah = data.data[0];
    updateSurahInfo(surah);
  } catch (error) {
    surahInfo.innerHTML = `
      <div class="text-red-500 text-sm font-bold sm:text-lg">
        Failed to load Surah data. <button onclick="window.location.reload()" class="text-blue-500 underline">Retry</button>
      </div>
    `;
  }
});

//on change update surah list
surahList.addEventListener("change", () => {
  languageList.value = "Arabic";
  const surahNumber = surahList.value;
  fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,en.sahih`
  )
    .then((response) => response.json())
    .then((data) => {
      const surah = data.data[0];
      const ayahCount = surah.ayahs.length;
      const sujudCount = surah.ayahs.filter((ayah) => ayah.sajda).length;

      surahInfo.innerHTML = `
			       
			        <p class="text-sm font-bold sm:text-lg">Number of ayahs: ${ayahCount}</p>
			        <p class="text-sm font-bold sm:text-lg">Number of sujud: ${sujudCount}</p>
            
			      
			      `;

      // const ayahs = surah.ayahs;
      // const ayahText = ayahs.map((ayah) => ayah.text).join("<br>");
      // document.getElementById("ayah-list").innerHTML = ayahText;
    })
    .catch((error) => {
      console.log(error);
      alert("error 404 not found!");
    });

  // Set the retrieved URL as the src attribute of the audio element
  audioPlayer.src = `https://github.com/Treposting/Surah-API/blob/main/Surah/${surahNumber}.mp3?raw=true`;
});

//
window.addEventListener("load", () => {
  fetch(
    `https://api.alquran.cloud/v1/surah/1/editions/quran-simple,en.sahih,bn.bengali`
  )
    .then((response) => response.json())
    .then((data) => {
      const surah = data.data;
      let surahHTML = "";
      surah[0].ayahs.forEach((ayah) => {
        if (surah[0].ayahs[ayah.numberInSurah - 1].sajda == false) {
          surahHTML += `
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        } else {
          surahHTML += `
        
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
        <h1 class="text-xl   font-extrabold">[Sajda]</h1>  
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        }
      });
      quran.innerHTML = surahHTML;
    })
    .catch((error) => {
      console.log(error);
      alert("error 404 not found!");
    });

  // Set the retrieved URL as the src attribute of the audio element
  audioPlayer.src = `https://github.com/Treposting/Surah-API/blob/main/Surah/1.mp3?raw=true`;
});

//
surahList.addEventListener("change", () => {
  const surahNumber = surahList.value;
  fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,en.sahih,bn.bengali`
  )
    .then((response) => response.json())
    .then((data) => {
      const surah = data.data;

      let surahHTML = "";
      surah[0].ayahs.forEach((ayah) => {
        if (surah[0].ayahs[ayah.numberInSurah - 1].sajda == false) {
          surahHTML += `
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        } else {
          surahHTML += `
           
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
              <h1 class="text-xl   font-extrabold">[Sajda]</h1> 
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        }
      });
      quran.innerHTML = surahHTML;
    })
    .catch((error) => {
      console.log(error);
      alert("404");
    });

  // Set the retrieved URL as the src attribute of the audio element
  audioPlayer.src = `https://github.com/Treposting/Surah-API/blob/main/Surah/${surahNumber}.mp3?raw=true`;
});

//
languageList.addEventListener("change", () => {
  const surahNumber = surahList.value;

  const selectElement = document.getElementById("language");
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const selectedText = selectedOption.textContent;
  let chooser = -1;
  if (selectedText == "English") chooser = 1;
  else if (selectedText == "Bengali") chooser = 2;
  else chooser = 0;
  fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,en.sahih,bn.bengali`
  )
    .then((response) => response.json())
    .then((data) => {
      const surah = data.data;

      let surahHTML = "";
      surah[chooser].ayahs.forEach((ayah) => {
        if (surah[0].ayahs[ayah.numberInSurah - 1].sajda == false) {
          surahHTML += `
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        } else {
          surahHTML += `
           
        <h1 class="text-xl   font-extrabold">${ayah.numberInSurah}</h1> 
              <h1 class="text-xl   font-extrabold">[Sajda]</h1> 
        <p class="text-center mt-2 mb-4 font-bold">${ayah.text}</p>
        `;
        }
      });
      quran.innerHTML = surahHTML;
    })
    .catch((error) => {
      console.log(error);
      alert("error 404 not found!");
    });

  // Set the retrieved URL as the src attribute of the audio element
  // audioPlayer.src = `https://github.com/Treposting/Surah-API/blob/main/Surah/${surahNumber}.mp3?raw=true`;
});

const audioLoading = document.getElementById("audio-loading");

if (
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /FBAN/i.test(navigator.userAgent) ||
  /Instagram/i.test(navigator.userAgent) ||
  /discord/i.test(navigator.userAgent) ||
  /LinkedIn/.test(navigator.userAgent)
) {
  audioPlayer.addEventListener("loadedmetadata", () => {
    audioLoading.style.display = "none";
  });
} else {
  // Add  indicator element
  audioPlayer.onloadstart = () => {
    // Show the loading indicator when the audio file starts loading
    audioLoading.classList.remove("hidden");

    audioPlayer.classList.add("animate-bounce");
  };

  audioPlayer.oncanplaythrough = () => {
    // Hide the loading indicator and remove the animation when the audio file has finished loading
    audioLoading.classList.add("hidden");
    audioPlayer.classList.remove("animate-bounce");
  };
}

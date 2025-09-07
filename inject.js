
(function injectLeetCodeMentor() {
    const interval = setInterval(async () => {
        const targetDiv = document.querySelector(".elfjS");
        if (!targetDiv) return;

        if (document.getElementById("leetcode-mentor-container")) {
            clearInterval(interval);
            return;
        }

        const slug = window.location.pathname
            .split("/problems/")[1]
            ?.split("/")[0];
        const notesKey = `notes_${slug}`;
        const timerKey = `timer_${slug}`;

        // Container (dark theme)
        const container = document.createElement("div");
        container.id = "leetcode-mentor-container";
        container.style.backgroundColor = "#1F1F1F";
        container.style.color = "#ffffff";
        container.style.padding = "16px";
        container.style.borderRadius = "12px";
        container.style.marginBottom = "12px";
        container.style.fontFamily = "Arial, sans-serif";
        container.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

        // Heading
        const heading = document.createElement("h3");
        heading.textContent = "LeetCode Mentor";
        heading.style.margin = "0 0 12px 0";
        heading.style.fontSize = "20px";
        heading.style.fontWeight = "bold";
        heading.style.color = "#ffffff";
        container.appendChild(heading);

        // Notes section (inline with main container)
        const noteSpan = document.createElement("div");
        noteSpan.id = "personal-note-span";
        noteSpan.style.marginBottom = "12px";
        noteSpan.style.fontSize = "14px";
        noteSpan.style.lineHeight = "1.5";
        noteSpan.innerHTML = `<strong>Personal note:</strong> Loading...`;
        container.appendChild(noteSpan);

        // References links section
        const linksDiv = document.createElement("div");
        linksDiv.style.display = "flex";
        linksDiv.style.gap = "16px";
        linksDiv.style.marginBottom = "12px";
        linksDiv.style.flexWrap = "wrap";

        const createLink = (text, url) => {
            const link = document.createElement("a");
            link.textContent = text;
            link.href = url;
            link.target = "_blank";
            link.style.color = "#F4AF3B";
            link.style.textDecoration = "none";
            link.style.fontWeight = "bold";
            link.style.fontSize = "14px";
            link.addEventListener(
                "mouseover",
                () => (link.style.textDecoration = "underline")
            );
            link.addEventListener(
                "mouseout",
                () => (link.style.textDecoration = "none")
            );
            return link;
        };

        linksDiv.appendChild(
            createLink(
                "Videos",
                `https://www.youtube.com/results?search_query=${encodeURIComponent(
                    slug.replace(/-/g, " ")
                )}`
            )
        );
        linksDiv.appendChild(
            createLink(
                "GitHub Solutions",
                `https://github.com/search?q=leetcode+${encodeURIComponent(
                    slug.replace(/-/g, " ")
                )}`
            )
        );
        linksDiv.appendChild(
            createLink(
                "Stack Overflow",
                `https://stackoverflow.com/search?q=leetcode+${encodeURIComponent(
                    slug.replace(/-/g, " ")
                )}`
            )
        );

        container.appendChild(linksDiv);

        // Stopwatch container
        const stopwatchDiv = document.createElement("div");
        stopwatchDiv.style.display = "flex";
        stopwatchDiv.style.alignItems = "center";
        stopwatchDiv.style.gap = "12px";

        const timeDisplay = document.createElement("span");
        timeDisplay.textContent = "00:00:00";
        timeDisplay.style.fontSize = "28px";
        timeDisplay.style.fontFamily = "monospace";
        timeDisplay.style.fontWeight = "bold";
        timeDisplay.style.letterSpacing = "2px";
        timeDisplay.style.color = "#ffffff";

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "Start";
        toggleBtn.style.padding = "6px 14px";
        toggleBtn.style.borderRadius = "6px";
        toggleBtn.style.border = "none";
        toggleBtn.style.cursor = "pointer";
        toggleBtn.style.backgroundColor = "#F4AF3B";
        toggleBtn.style.color = "#1F1F1F";
        toggleBtn.style.fontWeight = "bold";
        toggleBtn.style.transition = "0.2s";
        toggleBtn.addEventListener(
            "mouseover",
            () => (toggleBtn.style.opacity = "0.8")
        );
        toggleBtn.addEventListener(
            "mouseout",
            () => (toggleBtn.style.opacity = "1")
        );

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "Reset";
        resetBtn.style.padding = "6px 14px";
        resetBtn.style.borderRadius = "6px";
        resetBtn.style.border = "none";
        resetBtn.style.cursor = "pointer";
        resetBtn.style.backgroundColor = "#2d2d2d";
        resetBtn.style.color = "#ffffff";
        resetBtn.style.fontWeight = "bold";
        resetBtn.style.transition = "0.2s";
        resetBtn.addEventListener(
            "mouseover",
            () => (resetBtn.style.opacity = "0.8")
        );
        resetBtn.addEventListener(
            "mouseout",
            () => (resetBtn.style.opacity = "1")
        );

        stopwatchDiv.appendChild(timeDisplay);
        stopwatchDiv.appendChild(toggleBtn);
        stopwatchDiv.appendChild(resetBtn);
        container.appendChild(stopwatchDiv);

        // Inject above problem description
        targetDiv.prepend(container);

        // Load note
        chrome.storage.local.get([notesKey], (result) => {
            noteSpan.innerHTML = `<strong>Personal note:</strong> ${
                result[notesKey] || "No notes"
            }`;
        });

        // Stopwatch logic
        let elapsed = 0;
        let timerInterval = null;

        chrome.storage.local.get([timerKey], (result) => {
            elapsed = result[timerKey] || 0;
            updateDisplay();
        });

        function updateDisplay() {
            const hrs = String(Math.floor(elapsed / 3600)).padStart(2, "0");
            const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(
                2,
                "0"
            );
            const secs = String(elapsed % 60).padStart(2, "0");
            timeDisplay.textContent = `${hrs}:${mins}:${secs}`;
        }

        toggleBtn.addEventListener("click", () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
                toggleBtn.textContent = "Resume";
                toggleBtn.style.backgroundColor = "#F4AF3B";
            } else {
                timerInterval = setInterval(() => {
                    elapsed++;
                    updateDisplay();
                    chrome.storage.local.set({ [timerKey]: elapsed });
                }, 1000);
                toggleBtn.textContent = "Pause";
                toggleBtn.style.backgroundColor = "#FF6F3B"; // Pause color
            }
        });

        resetBtn.addEventListener("click", () => {
            elapsed = 0;
            updateDisplay();
            chrome.storage.local.set({ [timerKey]: 0 });
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            toggleBtn.textContent = "Start";
            toggleBtn.style.backgroundColor = "#F4AF3B";
        });

        console.log("✅ LeetCode Mentor container injected with inline notes!");
        clearInterval(interval);
    }, 300);
})();

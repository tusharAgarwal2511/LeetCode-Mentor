document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let url = tabs[0]?.url || "";

        if (!/^https:\/\/leetcode\.com\/problems\/[^\/]+\/?$/i.test(url)) {
            document.getElementById("main-content").style.display = "none";
            document.getElementById("not-leetcode").style.display = "block";
            return;
        }

        // Extract problem name
        let problemSlug = url.split("/problems/")[1].split("/")[0];
        let cacheKey = `insights_${problemSlug}`;
        let notesKey = `notes_${problemSlug}`; // <-- Notes key

        // Tab switching logic
        const tabsBtn = document.querySelectorAll(".tab-button");
        const sections = document.querySelectorAll(".tab-section");

        tabsBtn.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabsBtn.forEach((t) => t.classList.remove("active"));
                sections.forEach((s) => s.classList.remove("active"));

                tab.classList.add("active");
                document
                    .getElementById(tab.dataset.section)
                    .classList.add("active");
            });
        });

        // Load Insights
        loadInsights(problemSlug, cacheKey);

        // Load Notes
        loadNotes(notesKey);

        // Save Notes
        document.getElementById("save-notes").addEventListener("click", () => {
            let content = document.getElementById("notes-area").value;
            localStorage.setItem(notesKey, content);
            alert("✅ Notes saved!");
        });
    });
});

async function loadInsights(problemSlug, cacheKey) {
    let cached = localStorage.getItem(cacheKey);

    if (cached) {
        let data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 3 * 24 * 60 * 60 * 1000) {
            displayInsights(data.insights);
            return;
        } else {
            localStorage.removeItem(cacheKey);
        }
    }

    let teaches = await fetchInsight(
        `explain what can I learn from this leetcode problem ${problemSlug} in 1 sentence, only return the response and nothing else`
    );
    let prerequisites = await fetchInsight(
        `tell me the prerequisites before solving this leetcode problem ${problemSlug} in 1 sentence, only return the response and nothing else`
    );
    let usecase = await fetchInsight(
        `explain a real world use case for this leetcode problem ${problemSlug} in 1 sentence, only return the response and nothing else`
    );

    let insights = { teaches, prerequisites, usecase };

    localStorage.setItem(
        cacheKey,
        JSON.stringify({ insights, timestamp: Date.now() })
    );
    displayInsights(insights);
}

async function fetchInsight(question) {
    try {
        let res = await fetch("https://gemini-ask-api.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
        });
        let data = await res.json();
        return data.answer.trim();
    } catch (err) {
        return "⚠️ Failed to load.";
    }
}

function displayInsights({ teaches, prerequisites, usecase }) {
    document.getElementById("insight-teaches").textContent = teaches;
    document.getElementById("insight-prerequisites").textContent =
        prerequisites;
    document.getElementById("insight-usecase").textContent = usecase;
}


document.getElementById("clear-cache-btn").addEventListener("click", () => {
    if (
        confirm(
            "Are you sure you want to delete ALL saved notes and insights? This cannot be undone."
        )
    ) {
        for (let key in localStorage) {
            if (key.startsWith("insights_") || key.startsWith("notes_")) {
                localStorage.removeItem(key);
            }
        }
        alert("✅ All saved notes and AI insights have been cleared.");
        location.reload(); 
    }
});

// Load notes from localStorage
function loadNotes(notesKey) {
    let saved = localStorage.getItem(notesKey);
    if (saved) {
        document.getElementById("notes-area").value = saved;
    }
}
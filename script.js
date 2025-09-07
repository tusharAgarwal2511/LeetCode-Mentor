
async function getLoggedInUsername(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript(
            {
                target: { tabId },
                func: () => {
                    // 1. Match links whose href is like /u/{username}/
                    const link = document.querySelector('a[href^="/u/"]');
                    if (link) {
                        const href = link.getAttribute("href"); 
                        const match = href.match(/\/u\/([^\/]+)\/?/); // capture text between /u/ and end
                        if (match) return match[1];
                    }

                    // 2. Other fallback selectors
                    const spanUser = document.querySelector("span.username");
                    if (spanUser) return spanUser.textContent.trim();

                    const profileLink = document.querySelector(
                        'a[href^="/profile/"]'
                    );
                    if (profileLink) {
                        let name = profileLink.textContent.trim();
                        if (name.startsWith("@")) name = name.slice(1);
                        return name;
                    }

                    return null;
                },
            },
            (results) => resolve(results?.[0]?.result || null)
        );
    });
}


// ===================== DOM CONTENT LOADED =====================
document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url || "";
        const isLeetCode = /^https:\/\/leetcode\.com\//i.test(url);
        // const isProblemPage = /^https:\/\/leetcode\.com\/problems\/[^\/]+\/?$/i.test(url);
        const isProblemPage = /^https:\/\/leetcode\.com\/problems\/[^\/]+(\/.*)?$/i.test(url);


        // Show/hide tab sections based on page
        document.querySelectorAll(".tab-section").forEach((section) => {
            const content = section.querySelector(".section-content");
            const unavailable = section.querySelector(".section-unavailable");

            if (section.id === "notes" || section.id === "insights") {
                if (isProblemPage) {
                    content.style.display = "block";
                    unavailable.style.display = "none";
                } else {
                    content.style.display = "none";
                    unavailable.style.display = "block";
                }
            } else if (section.id === "focus-area") {
                if (isLeetCode) {
                    content.style.display = "block";
                    unavailable.style.display = "none";
                } else {
                    content.style.display = "none";
                    unavailable.style.display = "block";
                }
            }
        });

        // Tab switching
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

                if (tab.dataset.section === "focus-area") {
                    const tabId = tabs[0].id;
                    loadDifficultyChart();
                    loadContestData();
                    loadTopicData();
                }
            });
        });

        // Load notes and insights if problem page
        if (isProblemPage) {
            // const problemSlug = url.split("/problems/")[1].split("/")[0];
            const problemSlug = url.split("/problems/")[1].split("/")[0];  

            const cacheKey = `insights_${problemSlug}`;
            const notesKey = `notes_${problemSlug}`;
            loadInsights(problemSlug, cacheKey);
            loadNotes(notesKey);

            document.getElementById("save-notes").addEventListener("click", () => {
                    const content = document.getElementById("notes-area").value;
                    chrome.storage.local.set({ [notesKey]: content }, () => {
                        alert("✅ Notes saved!");
                    });
                });
        }

        // ✅ Call Difficulty Chart immediately if Focus Area tab is visible
        const activeTab =
            document.querySelector(".tab-button.active")?.dataset.section;
        if (activeTab === "focus-area") {
            const tabId = tabs[0].id;
            loadDifficultyChart();
            loadContestData();
            loadTopicData();
        }
    });
});


// ===================== INSIGHTS =====================
async function loadInsights(problemSlug, cacheKey) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 3 * 24 * 60 * 60 * 1000) {
            displayInsights(data.insights);
            return;
        } else {
            localStorage.removeItem(cacheKey);
        }
    }

    const pseudocode = await fetchInsight(
        `pseudo code to solve leetcode problem ${problemSlug} without comments, return only the response and nothing else`
    );

    const teaches = await fetchInsight(
        `explain what can I learn from this leetcode problem ${problemSlug} in 1 sentence, only return the response`
    );
    const prerequisites = await fetchInsight(
        `tell me the prerequisites before solving this leetcode problem ${problemSlug} in 1 sentence, only return the response`
    );
    const usecase = await fetchInsight(
        `explain a real world use case for this leetcode problem ${problemSlug} in 1 sentence, only return the response`
    );

    const insights = { pseudocode, teaches, prerequisites, usecase };
    localStorage.setItem(cacheKey, JSON.stringify({ insights, timestamp: Date.now() }));
    displayInsights(insights);
}

async function fetchInsight(question) {
    try {
        const res = await fetch("https://gemini-ask-api.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
        });
        const data = await res.json();
        return data.answer.trim();
    } catch (err) {
        return "⚠️ Failed to load.";
    }
}

function displayInsights({ pseudocode, teaches, prerequisites, usecase }) {
    if (pseudocode)
        document.getElementById("insight-pseudocode").textContent = pseudocode;
    document.getElementById("insight-teaches").textContent = teaches;
    document.getElementById("insight-prerequisites").textContent =prerequisites;
    document.getElementById("insight-usecase").textContent = usecase;
}


function loadNotes(notesKey) {
    chrome.storage.local.get([notesKey], (result) => {
        if (result[notesKey]) {
            document.getElementById("notes-area").value = result[notesKey];
        }
    });
}


document.getElementById("clear-cache-btn").addEventListener("click", () => {
    if (
        confirm(
            "Are you sure you want to delete All saved notes, AI insights and timers? This cannot be undone."
        )
    ) {
        chrome.storage.local.get(null, (items) => {
            const keysToRemove = Object.keys(items).filter(
                (key) =>
                    key.startsWith("notes_") ||
                    key.startsWith("insights_") ||
                    key.startsWith("timer_")
            );
            chrome.storage.local.remove(keysToRemove, () => {
                alert("✅ All saved data has been cleared.");
                location.reload();
            });
        });
    }
});

async function loadDifficultyChart() {
    const container = document.getElementById("difficulty-data");
    if (!container) return;

    // const username = "tusharAgarwal2511"; // hardcoded for now
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    const username = await getLoggedInUsername(tab.id);

    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `
                    query getUserProfile($username: String!) {
                        matchedUser(username: $username) {
                            submitStats: submitStatsGlobal {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: { username },
            }),
        });

        const data = await res.json();
        const stats = data.data.matchedUser.submitStats.acSubmissionNum;

        const easy = stats.find((d) => d.difficulty === "Easy")?.count || 0;
        const medium = stats.find((d) => d.difficulty === "Medium")?.count || 0;
        const hard = stats.find((d) => d.difficulty === "Hard")?.count || 0;

        const total = easy + medium + hard;
        const easyPercent = ((easy / total) * 100).toFixed(0);
        const mediumPercent = ((medium / total) * 100).toFixed(0);
        const hardPercent = ((hard / total) * 100).toFixed(0);

        container.innerHTML = `
        <p class="total">Total Solved: ${total}</p>
            <div class="difficulty-bar">
                <div class="bar easy" style="width: ${easyPercent}%;"></div>
                <div class="bar medium" style="width: ${mediumPercent}%;"></div>
                <div class="bar hard" style="width: ${hardPercent}%;"></div>
            </div>
            <div class="difficulty-labels">
                <span>🟢 Easy: ${easy}</span>
                <span>🟡 Medium: ${medium}</span>
                <span>🔴 Hard: ${hard}</span>
            </div>
        `;
    } catch (err) {
        container.innerHTML = "⚠ Failed to load Difficulty data.";
        console.error(err);
    }
}


async function loadContestData() {
    const container = document.getElementById("contest-data");
    if (!container) return;

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    const username = await getLoggedInUsername(tab.id);
    if (!username) {
        container.innerHTML = "⚠ Failed to fetch username.";
        return;
    }

    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `
                    query getUserContestData($username: String!) {
                        userContestRanking(username: $username) {
                            attendedContestsCount
                            rating
                            globalRanking
                            totalParticipants
                            topPercentage
                        }
                    }
                `,
                variables: { username },
            }),
        });

        const data = await res.json();
        const stats = data.data.userContestRanking;

        if (!stats) {
            container.innerHTML = "⚠ No contest data available.";
            return;
        }

        container.innerHTML = `
            <div class="contest-card">
                <div class="contest-header">
                    <h3>🏆 Contest Stats</h3>
                    <div class="contest-rating">Rating: ${stats.rating.toFixed(
                        0
                    )}</div>
                </div>
                <div class="contest-stats">
                    <div class="stat-box">
                        <span>${stats.attendedContestsCount}</span>
                        <label>Contests</label>
                    </div>
                    <div class="stat-box">
                        <span>${stats.globalRanking.toLocaleString()}</span>
                        <label>Global Rank</label>
                    </div>
                    <div class="stat-box">
                        <span>${stats.totalParticipants.toLocaleString()}</span>
                        <label>Participants</label>
                    </div>
                    <div class="stat-box">
                        <span>Top ${stats.topPercentage.toFixed(1)}%</span>
                        <label>Percentile</label>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = "⚠ Failed to load contest data.";
        console.error(err);
    }
}







async function loadTopicData() {
    const container = document.getElementById("topic-data");
    if (!container) return;

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    const username = await getLoggedInUsername(tab.id);
    if (!username) {
        container.innerHTML = "⚠ Failed to fetch username.";
        return;
    }

    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `
                    query getUserTopicStats($username: String!) {
                        matchedUser(username: $username) {
                            tagProblemCounts {
                                advanced { tagName problemsSolved }
                                intermediate { tagName problemsSolved }
                                fundamental { tagName problemsSolved }
                            }
                        }
                    }
                `,
                variables: { username },
            }),
        });

        const data = await res.json();
        const tags = data.data.matchedUser.tagProblemCounts;

        container.innerHTML = `
            ${renderTopicCard("Fundamental Topics", tags.fundamental)}
            ${renderTopicCard("Intermediate Topics", tags.intermediate)}
            ${renderTopicCard("Advanced Topics", tags.advanced)}
        `;

        // Add expand/collapse toggle
        document.querySelectorAll(".topic-header").forEach((header) => {
            header.addEventListener("click", () => {
                const list = header.nextElementSibling;
                list.style.display =
                    list.style.display === "grid" ? "none" : "grid";
            });
        });
    } catch (err) {
        container.innerHTML = "⚠ Failed to load topic data.";
        console.error(err);
    }
}





function renderTopicCard(title, topics) {
    if (!topics || topics.length === 0) return "";

    // Sort topics by most solved first
    topics.sort((a, b) => b.problemsSolved - a.problemsSolved);

    const totalSolved = topics.reduce((sum, t) => sum + t.problemsSolved, 0);
    if (totalSolved === 0) return "";

    // Colors for segments (reused in bar + labels + items)
    const colors = [
        "#4CAF50",
        "#2196F3",
        "#FFC107",
        "#F44336",
        "#9C27B0",
        "#00BCD4",
        "#FF9800",
        "#8BC34A",
        "#E91E63",
        "#795548",
    ];

    // Progress bar segments
    const segments = topics
        .map((t, i) => {
            const percent = ((t.problemsSolved / totalSolved) * 100).toFixed(1);
            return `
            <div class="topic-segment" 
                 style="width:${percent}%; background-color:${
                colors[i % colors.length]
            }" 
                 title="${t.tagName}: ${percent}%"></div>`;
        })
        .join("");

    // Labels (sorted order too)
    const labels = topics
        .map(
            (t, i) => `
        <div class="topic-label">
            <span style="background-color:${colors[i % colors.length]}"></span>
            ${t.tagName} (${t.problemsSolved})
        </div>
    `
        )
        .join("");

    // Grid items (detailed list)
    const items = topics
        .map(
            (t, i) => `
        <div class="topic-item">
            <span>${t.problemsSolved}</span>
            <label>${t.tagName}</label>
        </div>
    `
        )
        .join("");

    return `
        <div class="topic-card">
            <div class="topic-header">
                <h3>${title}</h3>
                <span>▼</span>
            </div>
            <div class="topic-progress">${segments}</div>
            <div class="topic-labels">${labels}</div>
            <div class="topic-list">${items}</div>
        </div>
    `;
}








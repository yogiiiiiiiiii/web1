let currentStudent = 0;
let currentTopicIndex = 0;
let totalStudents;
let totalTopics;
let topicsData = [];
let csvData = null;
let studentRollNumbers = [];

function generateQuestionForms() {
    const topicsForm = document.getElementById('topicsForm');
    const formData = new FormData(topicsForm);

    topicsData.forEach((topic, index) => {
        topic.topicName = document.getElementById(`topicName${index + 1}`).value;
        topic.hard.count = Number(document.getElementById(`hard${index + 1}`).value);
        topic.medium.count = Number(document.getElementById(`medium${index + 1}`).value);
        topic.easy.count = Number(document.getElementById(`easy${index + 1}`).value);
        
        if (!topic.hard.questions.length) topic.hard.questions = Array.from({length: topic.hard.count}, (_, i) => i + 1);
        if (!topic.medium.questions.length) topic.medium.questions = Array.from({length: topic.medium.count}, (_, i) => i + 1);
        if (!topic.easy.questions.length) topic.easy.questions = Array.from({length: topic.easy.count}, (_, i) => i + 1);

        topic.responses = Array(totalStudents).fill(null).map(() => ({
            hard: {}, medium: {}, easy: {}
        }));
        topic.choiceCounts = {
            "Not Attended": 0,
            "Don't Understand the Question": 0,
            "Don't Understand Basic": 0,
            "Can't Apply": 0,
            "Numerical Error": 0,
            "Complete Error in Shading": 0,
            "Complete": 0
        };
    });

    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';

    askQuestionsForTopic(currentTopicIndex);
}
function askQuestionsForTopic(topicIndex) {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = `<h2>${topicsData[topicIndex].topicName}</h2>`;
    const currentRollNo = studentRollNumbers[currentStudent] || `Student ${currentStudent + 1}`;
    document.getElementById('studentTitle').textContent = `Student - ${currentRollNo}: ${topicsData[topicIndex].topicName}`;

    const topic = topicsData[topicIndex];
    ['hard', 'medium', 'easy'].forEach(difficulty => {
        for (let i = 0; i < topic[difficulty].count; i++) {
            questionsContainer.innerHTML += generateQuestionHTML(topicIndex, difficulty, i);
        }
    });

    restorePreviousResponses(topicIndex);
}

function generateQuestionHTML(topicIndex, difficulty, questionIndex) {
    const topic = topicsData[topicIndex];
    const response = topic.responses[currentStudent - 1];
    const questionNumber = topic[difficulty].questions[questionIndex];
    const selectedValue = response ? response[difficulty][questionNumber] : "Not Attended";

    return `
        <div class="question-container">
            <h4>${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Question ${questionNumber}</h4>
            <select name="topic${topicIndex}_${difficulty}${questionNumber}" onchange="updateChoiceCount(this, ${topicIndex}, '${difficulty}', ${questionNumber})">
                <option value="Select an option" ${selectedValue === 'Select an option' ? 'selected' : ''}>Select an option</option>
                <option value="Not Attended" ${selectedValue === 'Not Attended' ? 'selected' : ''}>Not Attended</option>
                <option value="Don't Understand the Question" ${selectedValue === "Don't Understand the Question" ? 'selected' : ''}>Don't Understand the Question</option>
                <option value="Don't Understand Basic" ${selectedValue === "Don't Understand Basic" ? 'selected' : ''}>Don't Understand Basic</option>
                <option value="Can't Apply" ${selectedValue === "Can't Apply" ? 'selected' : ''}>Can't Apply</option>
                <option value="Numerical Error" ${selectedValue === "Numerical Error" ? 'selected' : ''}>Numerical Error</option>
                <option value="Complete Error in Shading" ${selectedValue === "Complete Error in Shading" ? 'selected' : ''}>Complete Error in Shading</option>
                <option value="Complete" ${selectedValue === 'Complete' ? 'selected' : ''}>Complete</option>
            </select>
        </div>
    `;
}

function restorePreviousResponses(topicIndex) {
    const topic = topicsData[topicIndex];
    if (topic.responses[currentStudent - 1]) {
        const responses = topic.responses[currentStudent - 1];
        for (let key in responses) {
            const select = document.querySelector(`select[name="topic${topicIndex}_${key}"]`);
            if (select) {
                select.value = responses[key];
                updateChoiceCount(select, topicIndex, key);
            }
        }
    }
}

function updateChoiceCount(select, topicIndex, difficulty, questionNumber) {
    const topic = topicsData[topicIndex];
    const response = topic.responses[currentStudent - 1];

    const selectedValue = select.value;
    const prevValue = response[difficulty][questionNumber];

    if (prevValue && prevValue !== "Select Option") {
        topic.choiceCounts[prevValue]--;
    }

    response[difficulty][questionNumber] = selectedValue;

    if (selectedValue !== "Select Option") {
        topic.choiceCounts[selectedValue]++;
    }
}
function prevTopic() {
    if (currentTopicIndex > 0) {
        currentTopicIndex--;
        askQuestionsForTopic(currentTopicIndex);
    }
}

function nextTopic() {
    if (currentTopicIndex < topicsData.length - 1) {
        currentTopicIndex++;
        askQuestionsForTopic(currentTopicIndex);
    } else {
        currentTopicIndex = 0;

        if (currentStudent < totalStudents) {
            currentStudent++;
            askQuestionsForTopic(currentTopicIndex);
        } else {
            generateReport();
        }
    }
}

function generateReport() {
    const reportContainer = document.getElementById('reportContainer');
    reportContainer.innerHTML = '';

    topicsData.forEach((topic, index) => {
        const topicReport = document.createElement('div');
        topicReport.classList.add('topic-report');

        const topicTitle = document.createElement('h3');
        topicTitle.textContent = topic.topicName;
        topicReport.appendChild(topicTitle);

        const canvas = document.createElement('canvas');
        topicReport.appendChild(canvas);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(topic.choiceCounts),
                datasets: [{
                    label: `Responses for ${topic.topicName}`,
                    data: Object.values(topic.choiceCounts),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384']
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const downloadGraphBtn = document.createElement('button');
        downloadGraphBtn.textContent = `Download Graph for ${topic.topicName}`;
        downloadGraphBtn.addEventListener('click', () => downloadGraph(index));
        topicReport.appendChild(downloadGraphBtn);

        reportContainer.appendChild(topicReport);
    });

    document.getElementById('step3').style.display = 'none';
    document.getElementById('report').style.display = 'block';
}

function downloadGraph(topicIndex) {
    const canvas = document.querySelectorAll('canvas')[topicIndex];
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `graph_report_${topicsData[topicIndex].topicName}.png`;
    link.click();
}

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Topic,Not Attended,Don't Understand the Question,Don't Understand Basic,Can't Apply,Numerical Error,Complete Error in Shading,Complete,Main Issue\n";

    const categories = ["Not Attended", "Don't Understand the Question", "Don't Understand Basic", "Can't Apply", "Numerical Error", "Complete Error in Shading", "Complete"];

    topicsData.forEach(topic => {
        const counts = topic.choiceCounts;
        const maxCount = Math.max(...categories.map(cat => counts[cat]));
        const mainIssue = categories.find(cat => counts[cat] === maxCount);

        let row = `${topic.topicName},`;
        categories.forEach(cat => {
            row += `${counts[cat]},`;
        });
        row += `${mainIssue}\n`;

        csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        csvData = e.target.result;
    };
    reader.readAsText(file);
}

function handleRollNoFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        studentRollNumbers = lines.slice(1).map(line => line.trim()).filter(line => line !== '');
        totalStudents = studentRollNumbers.length;
        document.getElementById('numStudents').value = totalStudents;
        document.getElementById('numStudents').disabled = true;
        console.log("Roll numbers loaded:", studentRollNumbers);
        console.log("Total students:", totalStudents);
    };
    reader.readAsText(file);
}

function parseCSV(csv) {
    const rows = csv.split('\n').map(row => row.trim().split(','));
    const topics = {};
    
    rows.forEach(row => {
        if (row.length >= 4) {
            const [topicName, difficulty, count, ...questionNumbers] = row;
            if (!topics[topicName]) {
                topics[topicName] = { topicName, hard: {}, medium: {}, easy: {} };
            }
            topics[topicName][difficulty === 'hard' ? 'hard' : difficulty === 'med' ? 'medium' : 'easy'] = {
                count: parseInt(count),
                questions: questionNumbers.map(Number)
            };
        }
    });
    
    return Object.values(topics);
}

function generateTopics() {
    totalStudents = parseInt(document.getElementById('numStudents').value, 10);
    totalTopics = parseInt(document.getElementById('numTopics').value, 10);
    
    const topicsContainer = document.getElementById('topicsContainer');
    topicsContainer.innerHTML = '';

    if (csvData) {
        const parsedTopics = parseCSV(csvData);
        totalTopics = parsedTopics.length;
        topicsData = parsedTopics;
    } else {
        topicsData = Array(totalTopics).fill().map(() => ({
            topicName: '',
            hard: { count: 0, questions: [] },
            medium: { count: 0, questions: [] },
            easy: { count: 0, questions: [] }
        }));
    }

    topicsData.forEach((topic, i) => {
        topicsContainer.innerHTML += `
            <div class="topic-container">
                <h3>Topic ${i + 1}</h3>
                <label for="topicName${i + 1}">Topic Name:</label>
                <input type="text" id="topicName${i + 1}" name="topicName${i + 1}" value="${topic.topicName}" required><br>
                <label for="hard${i + 1}">Number of hard questions:</label>
                <input type="number" id="hard${i + 1}" name="hard${i + 1}" min="0" value="${topic.hard.count}" required><br>
                <label for="medium${i + 1}">Number of medium questions:</label>
                <input type="number" id="medium${i + 1}" name="medium${i + 1}" min="0" value="${topic.medium.count}" required><br>
                <label for="easy${i + 1}">Number of easy questions:</label>
                <input type="number" id="easy${i + 1}" name="easy${i + 1}" min="0" value="${topic.easy.count}" required><br>
            </div>
        `;
    });

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

// Add this line at the end of the script
document.getElementById('csvFile').addEventListener('change', handleFileUpload);
document.getElementById('rollNoCsvFile').addEventListener('change', handleRollNoFileUpload);

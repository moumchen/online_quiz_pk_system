// 当 DOM 内容加载完成后执行以下代码
document.addEventListener('DOMContentLoaded', () => {
    let currentQuestion = 0; // 当前问题的索引，初始为 0
    let userQuizRecords = []; // 用于存储用户的答题记录
    const questions = document.querySelectorAll('.question-div'); // 获取所有问题的 DOM 元素
    let generationId = questions[0].dataset.generationId; // 获取题目的批次 ID

    // 为每个选项添加点击事件处理
    document.querySelectorAll('.option-box').forEach(option => {
        option.addEventListener('click', function () {
            // 如果当前选项已经被选中，则不再处理点击事件
            if (this.classList.contains('selected')) return;

            // 获取当前问题的正确答案
            const correctAnswer = this.parentElement.parentElement.dataset.correct;
            // 判断当前选项是否为正确答案
            const isCorrect = this.dataset.option === correctAnswer;

            const questionId = this.parentElement.parentElement.dataset.questionId;


            // 记录用户的答题信息
            const responseTime = 1000; // 计算答题时间（秒）
            userQuizRecords.push({
                question_id: questionId,
                selected_answer: this.dataset.option,
                response_time: responseTime,
                is_correct: isCorrect,
                generation_id: generationId,
            });

            // 显示结果
            this.classList.add(isCorrect ? 'correct' : 'error'); // 根据答案正确与否添加相应的类
            if (isCorrect) {
                // 如果答案正确，1秒后进入下一个问题
                setTimeout(nextQuestion, 1000);
            } else {
                // 如果答案错误，显示正确答案
                const correctOption = document.querySelector(`[data-option="${correctAnswer}"]`);
                correctOption.classList.add('correct'); // 将正确答案标记为正确
                setTimeout(nextQuestion, 1500); // 1.5秒后进入下一个问题
            }
        });
    });


    // 定义进入下一个问题的函数
    function nextQuestion() {
        questions[currentQuestion].style.display = 'none'; // 隐藏当前问题
        currentQuestion++; // 增加当前问题索引
        if (currentQuestion < questions.length) {
            questions[currentQuestion].style.display = 'block'; // 显示下一个问题
        } else {
            // 答题完成后，将答题记录发送到后端保存
            saveQuizRecords(userQuizRecords);
        }
    }

 function saveQuizRecords(records) {
    fetch('/singleplayer/save_quiz_records', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            records: records
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error("Failed to save quiz records:", response.status);
            // 可以添加错误处理逻辑
        }
        // 在请求成功后跳转
        window.location.href = `/singleplayer/report?generation_id=${generationId}`;
    })
    .catch(error => {
        console.error("Error saving quiz records:", error);
        // 可以添加错误处理逻辑
    });
}

    // 获取 CSRF token 的函数
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }


// 计时器功能
    let timeElapsed = 0; // 记录经过的时间，初始为 0
    const timer = setInterval(() => {
        timeElapsed++; // 每秒增加 1 秒
        // 更新计时器显示
        document.querySelector('.countdown').textContent =
            `${Math.floor(timeElapsed / 60)}:${('0' + timeElapsed % 60).slice(-2)}`; // 格式化为 MM:SS
    }, 1000); // 每 1000 毫秒（1 秒）执行一次

});

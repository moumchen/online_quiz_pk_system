document.addEventListener('DOMContentLoaded', () => {
    let currentQuestion = 0;
    let userQuizRecords = [];
    const questions = document.querySelectorAll('.question-div');
    let generationId = questions[0].dataset.generationId;

    function disableOptions() {
        document.querySelectorAll('.option-box').forEach(option => {
            option.classList.add('selected');
            option.style.pointerEvents = 'none';
        });
    }

    function enableOptions() {
        document.querySelectorAll('.option-box').forEach(option => {
            option.classList.remove('selected');
            option.classList.remove('correct');
            option.classList.remove('error');
            option.style.pointerEvents = 'auto';
        });
    }

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

            // 清除之前选中的选项
            document.querySelectorAll('.option-box').forEach(opt => {
                opt.classList.remove('selected', 'correct', 'error');
            });

            // 显示结果
            this.classList.add('selected');
            if (isCorrect) {
                this.classList.add('correct');
                setTimeout(nextQuestion, 1000);
            } else {
                this.classList.add('error');
                // 获取当前问题div
                const currentQuestionDiv = questions[currentQuestion];
                // 在当前问题div中查找正确选项
                const correctOption = currentQuestionDiv.querySelector(`[data-option="${correctAnswer}"]`);
                correctOption.classList.add('correct');
                setTimeout(nextQuestion, 1500);
            }
        });
    });


    function nextQuestion() {
        questions[currentQuestion].style.display = 'none';
        currentQuestion++;
        if (currentQuestion < questions.length) {
            enableOptions(); // 重置选项样式
            questions[currentQuestion].style.display = 'block';
        } else {
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


    let timeElapsed = 0;
    const timer = setInterval(() => {
        timeElapsed++;
        document.querySelector('.countdown').textContent =
            `${Math.floor(timeElapsed / 60)}:${('0' + timeElapsed % 60).slice(-2)}`;
    }, 1000);

});

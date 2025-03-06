# services/quiz_generation_service.py
import requests
import json
import uuid
from django.conf import settings  # 导入 settings
from ..models import QuizQuestion  # 确保导入你的模型 (使用相对导入)

def generate_quiz_questions(topic, difficulty, num_questions):
    """
    调用 DeepSeek API 生成题目并保存到数据库。

    Args:
        topic (str): 题目主题。
        difficulty (str): 题目难度。
        num_questions (int): 题目数量。

    Returns:
        dict: 包含题目数据的字典，或者错误信息。
    """

    api_url = "https://api.deepseek.com/chat/completions"
    generation_id = str(uuid.uuid4())  # 生成唯一批次 ID
    generated_questions = [] # 用于存储生成的题目

    # 构建 Prompt
    prompt = f"请生成 {num_questions} 道关于{topic}的{difficulty}难度的题目，每道题目包含 4 个选项（用A、B、C、D表示），其中一个是正确答案，格式为 {{\"题目列表\": [{{\"题目\": \"题目 1 内容\", \"选项\": {{\"A\": \"选项 1\", \"B\": \"选项 2\", \"C\": \"选项 3\", \"D\": \"选项 4\"}}, \"正确答案\": \"正确答案内容\"}}, ... ]}}，不要添加任何额外的文字或解释， 请给我纯文本不要md格式。"

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一个答题系统出题助手。"},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-4288fad1b97c408d810cde6d35ce4c99"  # 添加 Authorization header
    }

    try:
        response = requests.post(api_url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()  # 检查 HTTP 错误
        response_data = response.json()

        # 解析 JSON 数据
        content = response_data['choices'][0]['message']['content']
        try:
            quiz_data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON 解析错误: {content}")
            return {"error": f"JSON 解析错误: {e}"}

        # 保存到数据库
        for question_data in quiz_data['题目列表']:
            QuizQuestion.objects.create(
                generation_id=generation_id,
                category=topic,
                difficulty=difficulty,
                question_text=question_data['题目'],
                option_a=question_data['选项']['A'],
                option_b=question_data['选项']['B'],
                option_c=question_data['选项']['C'],
                option_d=question_data['选项']['D'],
                correct_answer=question_data['正确答案'],
            )
            generated_questions.append(question_data) # 将题目添加到列表中

        return {"题目列表": generated_questions} # 返回包含题目列表的字典

    except requests.exceptions.RequestException as e:
        print(f"API 请求错误: {e}")
        return {"error": f"API 请求错误: {e}"}
    except KeyError as e:
        print(f"JSON 结构错误: 缺少键 {e}")
        return {"error": f"JSON 结构错误: 缺少键 {e}"}
    except Exception as e:
        print(f"发生未知错误: {e}")
        return {"error": f"发生未知错误: {e}"}

from common.models import QuizQuestion


def get_all_questions(quiz_id):
    questions = QuizQuestion.objects.filter(generation_id=quiz_id).all()

    # 将整个对象放入列表
    questions_list = list(questions)  # 或者使用 [question for question in questions]

    return questions_list
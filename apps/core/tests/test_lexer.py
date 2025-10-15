from lexer.mylexer import lexer

def test_simple_expression():
    """
    Tests that the lexer correctly tokenizes a simple arithmetic expression.
    This function follows the 'test_*' naming convention that pytest looks for.
    """
    data = "3 + 4 - 5"
    lexer.input(data)

    # Collect all the tokens into a list
    tokens = []
    for tok in lexer:
        tokens.append((tok.type, tok.value))

    # Define what the correct sequence of tokens should be
    expected_tokens = [
        ('NUMBER', 3),
        ('PLUS', '+'),
        ('NUMBER', 4),
        ('MINUS', '-'),
        ('NUMBER', 5)
    ]

    # The core of the test: assert that the actual result matches the expected result.
    # If they don't match, pytest will report a failure.
    assert tokens == expected_tokens


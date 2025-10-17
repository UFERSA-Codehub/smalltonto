import sys

class Colors:
    '''
    Cores ANSI para saída de terminal
    '''

    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'

    def disable():
        '''
        Desabilita as cores ANSI
        '''
        Colors.RESET = ''
        Colors.RED = ''
        Colors.GREEN = ''
        Colors.YELLOW = ''
        Colors.BLUE = ''
        Colors.MAGENTA = ''
        Colors.CYAN = ''
        Colors.BOLD = ''

    
    def initialize():
        '''
        Inicializa as cores ANSI no terminal (necessário para Windows)
        '''
        if sys.platform == "win32":
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except Exception:
                Colors.disable()

def print_progress_bar(percentage, count, total, width=25):
    filled = int(width * percentage / 100)
    bar = '█' * filled + '░' * (width - filled)
    percentage_str = f"{percentage:5.1f}%"
    return f"{bar} {percentage_str} ({count}/{total})"

def get_category_color(category):
    if "CLASS" in category:
        return Colors.MAGENTA
    elif "RELATION" in category:
        return Colors.CYAN
    elif "LANGUAGE" in category:
        return Colors.YELLOW
    elif "DATA_TYPE" in category:
        return Colors.BLUE
    elif "META" in category:
        return Colors.GREEN
    else:
        return Colors.RESET

def format_summary_header():
    return f"\n{Colors.BOLD}{Colors.CYAN}📊 SUMMARY{Colors.RESET}"


def format_section_title(title, emoji=""):
    prefix = f"{emoji}  " if emoji else ""
    return f"{Colors.BOLD}{Colors.BLUE}{prefix}{title}{Colors.RESET}"


def format_error_message(message):
    return f"  {Colors.RED}→{Colors.RESET} {message}"


def format_success(text):
    return f"{Colors.GREEN}{text}{Colors.RESET}"


def format_error_count(count):
    if count > 0:
        return f"{Colors.RED}{count}{Colors.RESET}"
    else:
        return f"{Colors.GREEN}{count}{Colors.RESET} ✓"
import sys


class Colors:
    RESET = "\033[0m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"

    def disable():
        Colors.RESET = ""
        Colors.RED = ""
        Colors.GREEN = ""
        Colors.YELLOW = ""
        Colors.BLUE = ""
        Colors.MAGENTA = ""
        Colors.CYAN = ""
        Colors.BOLD = ""

    def initialize():
        # Detect if output is being piped or redirected
        if not sys.stdout.isatty():
            Colors.disable()
            return

        # On Windows, try to enable ANSI colors
        if sys.platform == "win32":
            try:
                import ctypes

                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except Exception:
                Colors.disable()


def print_progress_bar(percentage, count, total, width=25):
    filled = int(width * percentage / 100)
    bar = "█" * filled + "░" * (width - filled)
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
        return Colors.GREEN
    elif "META" in category:
        return Colors.BLUE
    else:
        return Colors.RESET


def format_summary_header():
    return f"{Colors.CYAN}SUMMARY{Colors.RESET}"


def format_distribution_title():
    return f"{Colors.BLUE}🏷️  Keywords & Stereotypes Distribution{Colors.RESET}"


def format_section_title(title, emoji=""):
    prefix = f"{emoji}  " if emoji else ""
    return f"{Colors.BOLD}{Colors.BLUE}{prefix}{title}{Colors.RESET}"


def format_error_section_header():
    return f"{Colors.RED}{Colors.BOLD}Lexical Errors:{Colors.RESET}"


def format_error_message(message):
    if message.startswith("Illegal character"):
        message = message + ", refer to the documentation for valid characters."
    return f"  {Colors.RED}→{Colors.RESET} {message}"


def format_no_keywords_message():
    return f"{Colors.YELLOW}No keywords or stereotypes found.{Colors.RESET}"


def format_total_keywords_label(total):
    return f"{Colors.BOLD}Total Keywords & Stereotypes:{Colors.RESET} {total}"


def format_error_count(count):
    if count > 0:
        return f"{Colors.RED}{count} ✗{Colors.RESET}"
    else:
        return f"{Colors.GREEN}{None} ✓{Colors.RESET}"


# Box drawing characters for different styles
BOX_STYLES = {
    "simple": {"tl": "+", "tr": "+", "bl": "+", "br": "+", "h": "-", "v": "|", "sep": "+"},
    "single": {"tl": "┌", "tr": "┐", "bl": "└", "br": "┘", "h": "─", "v": "│", "sep": "┼"},
    "double": {"tl": "╔", "tr": "╗", "bl": "╚", "br": "╝", "h": "═", "v": "║", "sep": "╬"},
    "rounded": {"tl": "╭", "tr": "╮", "bl": "╰", "br": "╯", "h": "─", "v": "│", "sep": "┼"},
    "heavy": {"tl": "┏", "tr": "┓", "bl": "┗", "br": "┛", "h": "━", "v": "┃", "sep": "╋"},
}


def strip_ansi_codes(text):
    import re

    ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    return ansi_escape.sub("", text)


def build_and_print_summary(
    filepath, code, token_count, category_counts, errors, counted_categories, token_lines=None, truncate=False, max_tokens=10
):
    print("\n")

    box = BOX_STYLES["rounded"]
    error_count = len(errors)
    content_lines = []

    # === SUMMARY INFO ===
    content_lines.append(f"{Colors.BOLD}{Colors.BLUE}File Summary:{Colors.RESET}")
    content_lines.append(f"{Colors.BOLD}File:{Colors.RESET} {filepath}")
    content_lines.append(f"{Colors.BOLD}Size:{Colors.RESET} {len(code)} characters")
    content_lines.append(f"{Colors.BOLD}Total Tokens:{Colors.RESET} {token_count}")
    content_lines.append(f"{Colors.BOLD}Lexical Errors:{Colors.RESET} {format_error_count(error_count)}")

    # === TOKENS ===
    if token_lines:
        content_lines.append("")  # spacing
        content_lines.append(format_section_title("TOKENS", emoji=""))

        header_line = f"  {'TOKEN TYPE':<25} {'VALUE':<20} {'CATEGORY':<20} {'LINE':<5} {'COLUMN'}"
        content_lines.append(f"{Colors.BOLD}{header_line}{Colors.RESET}")
        separator_line = f"  {'-' * 25} {'-' * 20} {'-' * 20} {'-' * 4} {'-' * 7}"
        content_lines.append(separator_line)

        lines_to_show = token_lines
        truncated = False

        if truncate and len(token_lines) > max_tokens:
            lines_to_show = token_lines[:max_tokens]
            truncated = True

        for line in lines_to_show:
            content_lines.append(f"  {line}")

        if truncated:
            hidden = len(token_lines) - max_tokens
            content_lines.append(f"{Colors.YELLOW}  ... ({hidden} more tokens hidden){Colors.RESET}")

    # === ERRORS ===
    if errors:
        content_lines.append("")  # spacing
        content_lines.append(format_error_section_header())
        for error in errors:
            content_lines.append(format_error_message(error))

    # === DISTRIBUTION ===
    if category_counts:
        total_keywords = sum(category_counts.values())
        content_lines.append("")
        content_lines.append(format_total_keywords_label(total_keywords))
        content_lines.append("")
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        max_category_length = max(len(cat) for cat, _ in sorted_categories)

        for category, count in sorted_categories:
            percentage = (count / total_keywords) * 100
            bar = print_progress_bar(percentage, count, total_keywords)
            color = get_category_color(category)
            content_lines.append(f"{color}{category:<{max_category_length}}{Colors.RESET} {bar}")
    else:
        content_lines.append("")
        content_lines.append(format_no_keywords_message())

    # === BOX RENDER ===
    title = format_summary_header()
    title_length = len(strip_ansi_codes(title))
    max_content_length = max(len(strip_ansi_codes(line)) for line in content_lines)
    content_width = max(title_length, max_content_length) + 4

    top_line = box["tl"] + box["h"] * content_width + box["tr"]
    bottom_line = box["bl"] + box["h"] * content_width + box["br"]
    title_padding = (content_width - title_length) // 2
    title_line = box["v"] + " " * title_padding + title + " " * (content_width - title_length - title_padding) + box["v"]
    separator = box["v"] + box["h"] * content_width + box["v"]

    print(top_line)
    print(title_line)
    print(separator)

    for line in content_lines:
        line_length = len(strip_ansi_codes(line))
        spaces_needed = content_width - line_length - 4
        padded_line = box["v"] + "  " + line + " " * spaces_needed + "  " + box["v"]
        print(padded_line)

    print(bottom_line)
    print()

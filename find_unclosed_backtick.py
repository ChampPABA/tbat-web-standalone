#!/usr/bin/env python3

def find_unclosed_backtick(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    backtick_count = 0
    for line_num, line in enumerate(lines, 1):
        for char_pos, char in enumerate(line):
            if char == '`':
                backtick_count += 1
                print(f"Line {line_num}, char {char_pos + 1}: Found backtick (total: {backtick_count})")
        
        # Check if backtick count is odd at end of line (unclosed)
        if backtick_count % 2 == 1:
            print(f"*** WARNING: Unclosed backtick detected at end of line {line_num}")
    
    print(f"\nTotal backticks: {backtick_count}")
    if backtick_count % 2 == 1:
        print("ERROR: Odd number of backticks - there's an unclosed template literal!")
    else:
        print("OK: Even number of backticks")

if __name__ == "__main__":
    find_unclosed_backtick("app/register/page.tsx")
# 读取CSS文件
with open('style.css', 'r', encoding='utf-8') as file:
    content = file.read()

# 修复.sword选择器
# 找到选择器的开始位置
start_idx = content.find('.sword {')
if start_idx != -1:
    # 找到选择器的结束位置，通过计算大括号的平衡
    brace_count = 1
    end_idx = start_idx + len('.sword {')
    
    # 遍历字符直到找到匹配的结束大括号
    while end_idx < len(content) and brace_count > 0:
        if content[end_idx] == '{':
            brace_count += 1
        elif content[end_idx] == '}':
            brace_count -= 1
        end_idx += 1
    
    if brace_count == 0:
        # 构建新的CSS规则
        new_rule = '.sword {'
        new_rule += '\n    background-image: url("https://yixiaostudio.github.io/maze-game/images/sword.png");'
        new_rule += '\n    background-size: contain;'
        new_rule += '\n    background-repeat: no-repeat;'
        new_rule += '\n    background-position: center;'
        new_rule += '\n}'
        
        # 替换旧规则为新规则
        content = content[:start_idx] + new_rule + content[end_idx:]
        
        # 写回文件
        with open('style.css', 'w', encoding='utf-8') as file:
            file.write(content)
        
        print(".sword选择器修复完成！")
    else:
        print("未找到匹配的结束大括号")
else:
    print("未找到.sword选择器")
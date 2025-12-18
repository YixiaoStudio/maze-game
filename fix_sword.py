# 读取CSS文件
with open('style.css', 'r', encoding='utf-8') as file:
    content = file.read()

# 修复.inventory-item.sword选择器
start_idx = content.find('.inventory-item.sword {')
if start_idx != -1:
    # 找到对应的结束大括号
    end_idx = content.find('}', start_idx)
    if end_idx != -1:
        # 构建新的CSS规则
        new_rule = '.inventory-item.sword {'
        new_rule += '\n    background-image: url("https://yixiaostudio.github.io/maze-game/images/sword.png");'
        new_rule += '\n    background-size: cover;'
        new_rule += '\n    background-repeat: no-repeat;'
        new_rule += '\n    background-position: center;'
        new_rule += '\n}'

        
        # 替换旧规则为新规则
        content = content[:start_idx] + new_rule + content[end_idx+1:]
        
        # 写回文件
        with open('style.css', 'w', encoding='utf-8') as file:
            file.write(content)
        
        print("修复完成！")
    else:
        print("未找到结束大括号")
else:
    print("未找到.inventory-item.sword选择器")

# 检查是否还有单独的.sword选择器
start_idx = content.find('.sword {')
if start_idx != -1:
    # 找到对应的结束大括号
    end_idx = content.find('}', start_idx)
    if end_idx != -1:
        # 构建新的CSS规则
        new_rule = '.sword {'
        new_rule += '\n    background-image: url("https://yixiaostudio.github.io/maze-game/images/sword.png");'
        new_rule += '\n    background-size: cover;'
        new_rule += '\n    background-repeat: no-repeat;'
        new_rule += '\n    background-position: center;'
        new_rule += '\n}'

        
        # 替换旧规则为新规则
        content = content[:start_idx] + new_rule + content[end_idx+1:]
        
        # 写回文件
        with open('style.css', 'w', encoding='utf-8') as file:
            file.write(content)
        
        print("修复.sword选择器完成！")
    else:
        print("未找到.sword选择器的结束大括号")
else:
    print("未找到单独的.sword选择器")
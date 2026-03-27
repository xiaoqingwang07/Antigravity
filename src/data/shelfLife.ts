import type { FoodCategory } from '../types/pantry'

/**
 * 食材类别 -> 默认保质期（天）
 * 参考产品需求：系统根据食材类别提供默认天数，用户只需"一键确认"
 */
export const SHELF_LIFE_DAYS: Record<FoodCategory, number> = {
  vegetable: 4,
  meat: 3,
  seafood: 2,
  fruit: 5,
  dairy: 7,
  egg: 30,
  grain: 60,
  seasoning: 180,
  other: 7,
}

/**
 * 食材名称 -> 类别映射（覆盖常见食材）
 */
export const INGREDIENT_CATEGORY: Record<string, FoodCategory> = {
  // 蔬菜
  '芋头': 'vegetable', '木耳': 'vegetable', '豆芽': 'vegetable', '金针菇': 'vegetable',
  '藕': 'vegetable', '青菜': 'vegetable', '白萝卜': 'vegetable', '西葫芦': 'vegetable',
  '生菜': 'vegetable', '香菇': 'vegetable', '娃娃菜': 'vegetable', '丝瓜': 'vegetable',
  '红薯': 'vegetable', '豆角': 'vegetable', '莴笋': 'vegetable', '包菜': 'vegetable',
  '芹菜': 'vegetable', '杏鲍菇': 'vegetable', '山药': 'vegetable', '油麦菜': 'vegetable',
  '油菜': 'vegetable', '韭菜': 'vegetable', '苦瓜': 'vegetable', '平菇': 'vegetable',
  '西红柿': 'vegetable', '番茄': 'vegetable', '黄瓜': 'vegetable', '茄子': 'vegetable',
  '西兰花': 'vegetable', '菠菜': 'vegetable', '南瓜': 'vegetable', '胡萝卜': 'vegetable',
  '花菜': 'vegetable', '青椒': 'vegetable', '辣椒': 'vegetable', '豆腐': 'vegetable',
  '洋葱': 'vegetable', '土豆': 'vegetable',
  // 肉类
  '猪肉': 'meat', '排骨': 'meat', '五花肉': 'meat', '牛肉': 'meat',
  '鸡肉': 'meat', '鸡翅': 'meat', '鸡腿': 'meat', '鸡胸肉': 'meat',
  '羊肉': 'meat', '牛腩': 'meat', '牛腱': 'meat', '肥牛': 'meat',
  '牛排': 'meat', '牛肉丸': 'meat', '火腿肠': 'meat', '午餐肉': 'meat',
  '里脊肉': 'meat', '肉末': 'meat',
  // 海鲜
  '鱼': 'seafood', '虾': 'seafood', '虾仁': 'seafood', '虾滑': 'seafood',
  '巴沙鱼': 'seafood', '鲈鱼': 'seafood', '带鱼': 'seafood', '三文鱼': 'seafood',
  // 蛋类
  '鸡蛋': 'egg',
  // 乳制品
  '牛奶': 'dairy', '酸奶': 'dairy', '奶酪': 'dairy',
  // 水果
  '苹果': 'fruit', '香蕉': 'fruit', '蓝莓': 'fruit', '柠檬': 'fruit',
  '草莓': 'fruit', '牛油果': 'fruit', '西瓜': 'fruit', '葡萄': 'fruit',
  '橙子': 'fruit', '芒果': 'fruit',
  // 主食
  '米饭': 'grain', '面条': 'grain', '意面': 'grain', '吐司': 'grain',
  '馒头': 'grain', '饺子皮': 'grain', '粉条': 'grain', '粉丝': 'grain', '年糕': 'grain',
  // 调味
  '大蒜': 'seasoning', '生姜': 'seasoning', '葱': 'seasoning', '八角': 'seasoning',
  '花椒': 'seasoning',
}

export const SPECIFIC_SHELF_LIFE: Record<string, number> = {
  '绿叶菜': 3, '青菜': 3, '生菜': 3, '菠菜': 3, '油麦菜': 3, '油菜': 3, '韭菜': 2,
  '香菇': 5, '金针菇': 4, '杏鲍菇': 5, '平菇': 4,
  '西红柿': 5, '番茄': 5, '土豆': 14, '洋葱': 14, '胡萝卜': 10, '白萝卜': 7,
  '鸡胸肉': 2, '鸡蛋': 30, '牛奶': 7,
  '虾': 1, '鱼': 1, '三文鱼': 2, '虾仁': 2,
  '香蕉': 4, '草莓': 3, '蓝莓': 5, '牛油果': 4,
}

export function getShelfLifeDays(name: string): number {
  if (SPECIFIC_SHELF_LIFE[name]) return SPECIFIC_SHELF_LIFE[name]
  const category = INGREDIENT_CATEGORY[name]
  if (category) return SHELF_LIFE_DAYS[category]
  return SHELF_LIFE_DAYS.other
}

export function getCategoryForName(name: string): FoodCategory {
  return INGREDIENT_CATEGORY[name] || 'other'
}

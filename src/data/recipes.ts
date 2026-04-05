/**
 * 默认菜谱库 - 扩充到15道
 * 覆盖各种场景：早餐、快手、跑后恢复、减脂等
 */
import type { Recipe } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'

const RAW_DEFAULT_RECIPES: Recipe[] = [
  {
    id: 1,
    title: '增肌鸡胸肉沙拉',
    quote: '低脂高蛋白，跑完来一碗！',
    rating: 4.8,
    count: 1204,
    emoji: '🥗',
    difficulty: '简单',
    time: 15,
    tags: ['🏃 跑者首选', '💪 增肌'],
    ingredients: [
      { name: '鸡胸肉', amount: '200g' },
      { name: '生菜', amount: '100g' },
      { name: '西红柿', amount: '1个' },
      { name: '橄榄油', amount: '1勺' },
      { name: '黑胡椒', amount: '适量' }
    ],
    steps: [
      { content: '鸡胸肉煮熟后撕成小块', time: 10, tip: '煮的时候加少许盐会更嫩' },
      { content: '生菜洗净撕成小块，西红柿切片', time: 2 },
      { content: '加入橄榄油、黑胡椒拌匀', time: 1, tip: '可加少许柠檬汁提味' }
    ],
    nutritionAnalysis: '高蛋白低卡，非常适合跑后修复肌肉纤维。碳水与蛋白比例约3:1，是跑后黄金30分钟的最佳补充。'
  },
  {
    id: 2,
    title: '快手牛肉炒意面',
    quote: '碳水与肉的完美结合',
    rating: 4.9,
    count: 850,
    emoji: '🍝',
    difficulty: '中等',
    time: 25,
    tags: ['🏃 跑者首选', '🍝 主食'],
    ingredients: [
      { name: '牛排', amount: '150g' },
      { name: '意面', amount: '100g' },
      { name: '洋葱', amount: '半个' },
      { name: '大蒜', amount: '2瓣' }
    ],
    steps: [
      { content: '意面煮8分钟捞出备用', time: 8, tip: '煮面时加一点盐和油' },
      { content: '牛排切条，洋葱切丝', time: 3 },
      { content: '热锅下蒜末炒香，加入牛肉翻炒', time: 4 },
      { content: '加入意面翻炒均匀，调味即可', time: 3 }
    ],
    nutritionAnalysis: '提供优质碳水和蛋白，为下一次长距离训练储备糖原。'
  },
  {
    id: 3,
    title: '番茄鸡蛋汤',
    quote: '简单快手，暖胃首选',
    rating: 4.7,
    count: 2100,
    emoji: '🍅',
    difficulty: '简单',
    time: 15,
    tags: ['⚡ 快手菜', '🍲 汤类'],
    ingredients: [
      { name: '鸡蛋', amount: '2个' },
      { name: '西红柿', amount: '2个' },
      { name: '葱', amount: '适量' }
    ],
    steps: [
      { content: '西红柿切块，鸡蛋打散', time: 2 },
      { content: '锅中加水烧开，放入西红柿', time: 5 },
      { content: '转小火，慢慢倒入蛋液', time: 2, tip: '边倒边搅动，蛋花更漂亮' },
      { content: '加盐调味，撒上葱花', time: 1 }
    ],
    nutritionAnalysis: '易消化吸收，补水又补电解质。跑后喝一碗热汤，舒服！'
  },
  {
    id: 4,
    title: '牛油果吐司',
    quote: '低卡饱腹，元气满满',
    rating: 4.6,
    count: 980,
    emoji: '🥑',
    difficulty: '简单',
    time: 10,
    tags: ['🌅 早餐', '⚡ 快手菜'],
    ingredients: [
      { name: '牛油果', amount: '1个' },
      { name: '吐司', amount: '2片' },
      { name: '鸡蛋', amount: '1个' },
      { name: '柠檬汁', amount: '少许' }
    ],
    steps: [
      { content: '吐司烤至金黄', time: 3 },
      { content: '牛油果去核捣成泥，加柠檬汁和盐', time: 2 },
      { content: '煎一个太阳蛋', time: 3 },
      { content: '牛油果泥抹在吐司上，放上煎蛋', time: 1 }
    ],
    nutritionAnalysis: '优质脂肪+碳水，早餐的好选择。牛油果提供持久的饱腹感。'
  },
  {
    id: 5,
    title: '香蕉奶昔',
    quote: '快速补给，能量炸弹',
    rating: 4.8,
    count: 1560,
    emoji: '🥛',
    difficulty: '简单',
    time: 5,
    tags: ['🌅 早餐', '⚡ 快手菜', '🏃 跑前补给'],
    ingredients: [
      { name: '香蕉', amount: '1根' },
      { name: '牛奶', amount: '250ml' },
      { name: '花生酱', amount: '1勺' }
    ],
    steps: [
      { content: '香蕉切段', time: 1 },
      { content: '所有材料放入料理机搅拌', time: 1 },
      { content: '搅拌30秒即可', time: 0.5 }
    ],
    nutritionAnalysis: '跑前30分钟喝一杯，快速补充能量。碳水+蛋白+优质脂肪组合。'
  },
  {
    id: 6,
    title: '蒜香西兰花',
    quote: '清爽解腻，维生素担当',
    rating: 4.6,
    count: 890,
    emoji: '🥦',
    difficulty: '简单',
    time: 12,
    tags: ['🥬 蔬菜', '💪 减脂'],
    ingredients: [
      { name: '西兰花', amount: '1颗' },
      { name: '大蒜', amount: '4瓣' },
      { name: '橄榄油', amount: '1勺' }
    ],
    steps: [
      { content: '西兰花切成小朵，焯水2分钟', time: 3 },
      { content: '热锅下蒜末炒香', time: 1 },
      { content: '加入西兰花翻炒，加盐调味', time: 2 }
    ],
    nutritionAnalysis: '膳食纤维丰富，热量极低，是健康餐的标配。'
  },
  {
    id: 7,
    title: '辣椒炒肉',
    quote: '下饭神器，家的味道',
    rating: 4.9,
    count: 3200,
    emoji: '🌶️',
    difficulty: '中等',
    time: 20,
    tags: ['🍳 下饭菜', '🥘 经典'],
    ingredients: [
      { name: '五花肉', amount: '200g' },
      { name: '青椒', amount: '2个' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '2勺' }
    ],
    steps: [
      { content: '五花肉切片，青椒切丝', time: 3 },
      { content: '热锅下肉片煸出油', time: 4 },
      { content: '加蒜末炒香，放入青椒', time: 2 },
      { content: '加生抽老抽调味，翻炒均匀', time: 3 }
    ],
    nutritionAnalysis: '经典下饭菜，五花肉的油脂让青椒更香。运动后吃胃口大开。'
  },
  {
    id: 8,
    title: '可乐鸡翅',
    quote: '小朋友的最爱',
    rating: 4.8,
    count: 2800,
    emoji: '🍗',
    difficulty: '中等',
    time: 35,
    tags: ['🍖 肉菜', '🥘 大菜'],
    ingredients: [
      { name: '鸡翅中', amount: '500g' },
      { name: '可乐', amount: '330ml' },
      { name: '生姜', amount: '3片' },
      { name: '八角', amount: '1个' }
    ],
    steps: [
      { content: '鸡翅洗净，两面划刀', time: 2 },
      { content: '冷水下锅，加姜片焯水', time: 5 },
      { content: '热锅下鸡翅煎至金黄', time: 5 },
      { content: '加可乐、八角、生抽，小火炖20分钟', time: 20, tip: '可乐选普通款，别用零度' }
    ],
    nutritionAnalysis: '鸡翅富含蛋白质，可乐提供糖分，是能量炸弹。'
  },
  {
    id: 9,
    title: '酸辣土豆丝',
    quote: '开胃神器，秒光盘',
    rating: 4.7,
    count: 2500,
    emoji: '🥔',
    difficulty: '简单',
    time: 15,
    tags: ['🥬 蔬菜', '⚡ 快手菜'],
    ingredients: [
      { name: '土豆', amount: '1个' },
      { name: '干辣椒', amount: '3个' },
      { name: '白醋', amount: '2勺' }
    ],
    steps: [
      { content: '土豆切丝，泡水去淀粉', time: 3 },
      { content: '热锅下干辣椒炒香', time: 1 },
      { content: '下土豆丝大火翻炒', time: 3 },
      { content: '沿锅边淋入白醋，加盐葱花', time: 2, tip: '白醋从锅边淋入更香' }
    ],
    nutritionAnalysis: '土豆提供优质碳水，酸辣开胃，百吃不厌。'
  },
  {
    id: 10,
    title: '香煎三文鱼',
    quote: '优质蛋白，秒变大厨',
    rating: 4.8,
    count: 650,
    emoji: '🐟',
    difficulty: '中等',
    time: 20,
    tags: ['🏃 跑者首选', '🐟 海鲜'],
    ingredients: [
      { name: '三文鱼排', amount: '200g' },
      { name: '柠檬', amount: '半个' },
      { name: '黑胡椒', amount: '适量' },
      { name: '迷迭香', amount: '少许' }
    ],
    steps: [
      { content: '三文鱼排用厨房纸吸干水分', time: 2 },
      { content: '两面撒盐和黑胡椒腌制5分钟', time: 5 },
      { content: '热锅下三文鱼，皮朝下煎3分钟', time: 3, tip: '皮朝下煎可以定型' },
      { content: '翻面再煎2分钟，撒上迷迭香', time: 2 },
      { content: '挤上柠檬汁', time: 1 }
    ],
    nutritionAnalysis: '三文鱼富含Omega-3脂肪酸，对跑步后的肌肉恢复特别有帮助。'
  },
  {
    id: 11,
    title: '虾仁蒸蛋',
    quote: '滑嫩可口，老少皆宜',
    rating: 4.7,
    count: 1100,
    emoji: '🥚',
    difficulty: '简单',
    time: 20,
    tags: ['🐟 海鲜', '🍲 汤类'],
    ingredients: [
      { name: '鸡蛋', amount: '3个' },
      { name: '虾仁', amount: '100g' },
      { name: '温水', amount: '200ml' },
      { name: '生抽', amount: '1勺' }
    ],
    steps: [
      { content: '鸡蛋打散，加温水1:1.5比例', time: 2 },
      { content: '蛋液过筛去泡沫', time: 1, tip: '这步决定口感滑嫩' },
      { content: '铺上虾仁，盖保鲜膜扎孔', time: 2 },
      { content: '蒸锅水开后放入，蒸10分钟', time: 10 },
      { content: '出锅淋生抽和香油', time: 1 }
    ],
    nutritionAnalysis: '高蛋白低脂肪，鸡蛋的蛋白质吸收率98%，是健身首选。'
  },
  {
    id: 12,
    title: '地三鲜',
    quote: '茄子土豆青椒，完美三角',
    rating: 4.8,
    count: 1800,
    emoji: '🍆',
    difficulty: '中等',
    time: 25,
    tags: ['🥬 素食', '🍳 下饭菜'],
    ingredients: [
      { name: '茄子', amount: '1个' },
      { name: '土豆', amount: '1个' },
      { name: '青椒', amount: '1个' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生抽', amount: '2勺' }
    ],
    steps: [
      { content: '茄子切块撒盐杀水，土豆切片', time: 5 },
      { content: '茄子土豆分别煎至金黄', time: 8 },
      { content: '青椒炒至断生', time: 3 },
      { content: '蒜末炒香，所有食材一起翻炒', time: 3 },
      { content: '加生抽老抽调味', time: 2 }
    ],
    nutritionAnalysis: '茄子富含花青素，土豆提供碳水，是素食者的能量来源。'
  },
  {
    id: 13,
    title: '麻婆豆腐',
    quote: '麻辣鲜香，米饭杀手',
    rating: 4.9,
    count: 2200,
    emoji: '🧈',
    difficulty: '中等',
    time: 20,
    tags: ['🥬 素食', '🌶️ 麻辣'],
    ingredients: [
      { name: '豆腐', amount: '1块' },
      { name: '肉末', amount: '100g' },
      { name: '郫县豆瓣酱', amount: '1勺' }
    ],
    steps: [
      { content: '豆腐切小块，盐水焯水去腥', time: 3 },
      { content: '热锅下肉末炒散', time: 3 },
      { content: '加豆瓣酱炒出红油', time: 2 },
      { content: '加水和豆腐煮5分钟', time: 5 },
      { content: '勾芡，撒花椒粉和葱花', time: 3 }
    ],
    nutritionAnalysis: '豆腐是优质植物蛋白来源，加上肉末荤素搭配均衡。'
  },
  {
    id: 14,
    title: '红烧肉',
    quote: '肥而不腻，入口即化',
    rating: 4.9,
    count: 3500,
    emoji: '🥩',
    difficulty: '中等',
    time: 60,
    tags: ['🥘 大菜', '🍖 肉菜'],
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '3勺' },
      { name: '老抽', amount: '1勺' }
    ],
    steps: [
      { content: '五花肉切方块，冷水下锅焯水', time: 5 },
      { content: '冰糖炒出糖色', time: 3, tip: '小火慢炒，不要焦了' },
      { content: '放入五花肉翻炒上色', time: 3 },
      { content: '加生抽老抽八角桂皮，加水没过肉', time: 2 },
      { content: '小火炖50分钟，大火收汁', time: 50 }
    ],
    nutritionAnalysis: '红烧肉是经典的能量炸弹，跑后补充碳水首选。'
  },
  {
    id: 15,
    title: '糖醋里脊',
    quote: '酸甜酥脆，小朋友最爱',
    rating: 4.8,
    count: 1900,
    emoji: '🍖',
    difficulty: '中等',
    time: 30,
    tags: ['🍖 肉菜', '🥘 大菜'],
    ingredients: [
      { name: '里脊肉', amount: '300g' },
      { name: '番茄酱', amount: '3勺' },
      { name: '糖', amount: '2勺' },
      { name: '醋', amount: '1勺' }
    ],
    steps: [
      { content: '里脊肉切条，用盐和蛋清腌制', time: 10 },
      { content: '裹淀粉下油锅炸至金黄', time: 8 },
      { content: '番茄酱、糖、醋、水调成酱汁', time: 2 },
      { content: '酱汁炒浓，放入里脊肉翻炒', time: 3 }
    ],
    nutritionAnalysis: '酸甜口味开胃，里脊肉蛋白质丰富。'
  }
]

export const DEFAULT_RECIPES: Recipe[] = RAW_DEFAULT_RECIPES.map(enrichRecipeMedia)

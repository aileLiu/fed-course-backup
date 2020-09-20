(function(root){
	var a = function(){};
	// js中函数也是对象
	var _ = function(data){
		if(!(this instanceof _)){
			return new _(data);
		}
		// new _(data)执行后, this指向_()，所以(this instanceof _)成立
		// 当前实例_()绑定了它自己传入的数据到warpper属性上
		this.warpper = data;
	}

	// 去重函数（通过callback，实现特殊元素处理）
	_.unique = function(data, cb){
		var res = [];
		for (var i = 0; i < data.length; i++) {
			var item = cb ? cb(data[i]) : data[i];
			if(res.indexOf(item) === -1){
				res.push(item);
			}
		};
		return res;
	}

	// reduce（累加）函数实现
	_.reduce = function(data, iteratee, memo, context){
		if(data == null) return null;// 数据不存在return null
		iteratee = _.iteratee(iteratee, context, 4);// 这里的4代表返回处理4个参数的fn（由这里决定走哪个callback）
		
		var keys = !data.length && Object.keys(data),
			length = (keys || data).length,
			index = 0;
		
		if(arguments.length < 3){ 
			memo = data[keys ? keys[index++] : index++];
		}

		// 这里index已完成+1（少一次循环）
		for (; index < length; index++) {
			var curKey = keys ? keys[index] : index;
			// 向新数组中，插入迭代函数执行的结果
			// 迭代函数传参由这里决定
			memo = iteratee(memo, data[curKey], index, data)
		};

		return memo;

	}

	// collect（map）函数实现
	// data 接收两种类型：数组 or 对象
	// iteratee 迭代器函数，包含要迭代的规则
	// context 需要改变this指向为此传入对象（？在哪改变）
	_.collect = function(data, iteratee, context){
		if(data == null) return [];// 数据不存在保证为[]
		iteratee = _.iteratee(iteratee, context);// 传入迭代器经过包装会丰富迭代器的功能，返回function

		// 1：如果data没有length为false，就执行Object.keys(data)=>输出对象的key组成的数组
		// 2: 如果data有length为true，keys = !true
		var keys = !data.length && Object.keys(data),
			// keys存在data就是对象，不存在就是数组
			length = (keys || data).length,
			res = Array(length);// 新数组
			// curKey;// ？可不可以不在这里声明

		for (var index = 0; index < length; index++) {
			// keys存在是对象，取key，否则取index作数组下标
			var curKey = keys ? keys[index] : index;
			// 向新数组中，插入迭代函数执行的结果
			// 迭代函数传参由这里决定
			res[index] = iteratee(data[curKey], index, data)
		};

		return res;

	}

	// 检测是否是function
	_.ifFunction = function(obj){
		return toString.call(obj) === '[object Function]';
	}

	function creatCallback(fn, context, argCount){
		// 无需改变this指向（正常情况迭代函数中的this指向window），就直接返回fn；
		// 否则进行下面的逻辑处理：改变this指向context
		if(context === void 0) return fn;
		// 参数长度固定明确的处理（迭代器函数有几个参数需要处理）：
		// argCount未传值，默认传参长度3
		switch(argCount == null ? 3 : argCount){
			case 1: 
				// value: 迭代数组的元素
				return function(value){
					return fn.call(context, value);
				};
			case 3: 
				// index: 迭代数组的元素de下标/对象的key
				// collection: 完整集合对象
				return function(value, index, collection){
					return fn.call(context, value, index, collection);
				};
			case 4: 
				// accumulator: 累加器
				return function(accumulator, value, index, collection){
					return fn.call(context, accumulator, value, index, collection);
				};
		}

		// 参数长度不固定处理：
		return function(){
			return fn.apply(context, arguments);
		};

	}
	// 迭代器的包装函数（进一步加工迭代器）
	// 进行context指向
	_.iteratee = function(value, context, argCount){
		// 保证返回fn
		if(value == null) return function(value){
			return value;
		};

		if(_.ifFunction(value)){
			// 真正实现包装的关键
			return creatCallback(value, context, argCount);
			
		}
	}

	// rest参数的包装函数
	_.restArgs = function(fn){

		var startIndex, curIndex;// 被包装函数参数长度的起始值
		startIndex = curIndex = fn.length - 1;
		// 不能以下这样写，这样写curIndex的挂载对象改变（可能是全局/当前的this实例，我们这里只需要curIndex生命周期在这个函数结束）
		// var startIndex, curIndex = fn.length - 1;

		// 外部赋值的对象 = fn
		return function(){

			var length = arguments.length;// 用户真实传参长度
			// 使用包装后de函数没有传参时
			// 扩展：被包装函数不存在接收指定参数时
			// 处理思维：传入想要支持的方法，返回支持rest的该方法（调用包装后的函数，即使没有参数也可以完成对被包装函数的调用）
			if(!length || curIndex == -1) return fn.apply(this, arguments);
			var rest = Array(length - startIndex);

			// 完成rest参数数组
			for (var i = 0; startIndex < length; startIndex++,i++) {
				rest[i] = arguments[startIndex];
			};

			// 建立新数组
			var argsArr = Array(curIndex + 1);
			// 向新数组填入非rest参数
			for (var i = 0; i < curIndex; i++) {
				argsArr[i] = arguments[i];
			};
			// 把rest数组作为元素插入新数组
			argsArr[curIndex] = rest;

			return fn.apply(this, argsArr);
		}

	}

	// 链式入口
	_.chain = function(data){
		console.log('chain-')
		
		var instance = _(data); // 新生成一个特殊实例（这里可以使用this吗？可以，但就不能支持方式2的流式编程了）
		instance._chain = true; // 扩展一个属性，用于说明是否处于流式编程状态
		return instance;
	}

	// 链式终结（这里直接放在prototype上，是因为两种方式都走的构造实例调用ending）
	_.prototype.ending = function(){
		console.log('ending-')

		this._chain = null; // 扩展一个属性，用于说明是否处于流式编程状态
		return this.warpper;
	}

	// 区分实例是否是链式特殊实例，执行不同返回（对象/数据处理结果）
	function model(instance, output){
		if(instance._chain){
			// 数据处理结果重写（保证流式编程中每道工序的第一参数是上一道工序的最新处理数据结果）
			instance.warpper = output;
			return instance;
		}
		return output;
	}

	// 获取target所有可枚举的属性，存储在数组中并返回
	_.prossess = function(target){
		var key,
			keysArr = [];
		for(key in target){
			keysArr.push(key);
		}

		return keysArr;
	}

	// 框架执行前调用的钩子
	function beforeHook(keysArr, callback){
		for(var i = 0; i<keysArr.length; i++){
			callback.call(keysArr, keysArr[i])
		}
	}

	// 混入：实现在对象的prototype上扩展对象的相同属性方法
	_.mixin = function(target){
		beforeHook(_.prossess(target), function(key){
			var fn = target[key];
			// 构造实例对象才走这里调用API（对象方式2会直接调用）
			_.prototype[key] = function(){
				// 利用apply+数组合并思想，使传参有弹性
				var decon = [this.warpper];
				Array.prototype.push.apply(decon, arguments);
				// 加入model函数，辅助流式编程实现
				return model(this, fn.apply(this, decon));
			}
		})
	}

	// 测试接口
	_.test = function(data, b, c, d){
		console.log('test')

		return data+b+c+d;
	}
	// 测试接口2(流式编程)
	_.test2 = function(data, b){
		console.log('test2')

		// 保证每到工序返回数据的处理结果，且下一道工序的第一个参数接收这个结果
		return data+b;
	}
	// 为了在程序一开始提前混入要提供的API
	// 使用要在函数下立即执行该函数，且新加API代码要放在执行前
	_.mixin(_);


	root._ = _;
})(this);
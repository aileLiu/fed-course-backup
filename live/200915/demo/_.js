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
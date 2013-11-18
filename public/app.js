'use strict';

/* App Module */

var CrudApp = angular.module('CrudApp', ['ngResource', 'ngRoute']).
	config(function($routeProvider) {
		$routeProvider.
	     when('/', { templateUrl: 'views/home.html', controller: 'IndexCtrl' }).
	     when('/:class/list', { templateUrl: 'views/list.html', controller: 'ListCtrl' }).
	     when('/:class/new', { templateUrl: 'views/form.html', controller: 'CreateCtrl' }).
	     when('/:class/edit/:id', { templateUrl: 'views/form.html', controller: 'EditCtrl' }).
	     when('/:class/:id/:related/list', { templateUrl: 'views/related.html', controller: 'RelatedListCtrl' }).
	     otherwise({redirectTo: '/'});
});

CrudApp.directive('activeLink', function($location) {
    var link = function(scope, element, attrs) {
        scope.$watch(function() { return $location.path(); },
        function(path) {
            var url = element.find('a').attr('href');
            if (url) {
                url = url.substring(1);
            }
            if (path == url) {
                element.addClass("active");
            } else {
                element.removeClass('active');
            }
        });
    };
    return {
        restrict: 'A',
        link: link
    };
});
// Factories

CrudApp.factory('Class', function($resource) { 
	return $resource('/api/:class/list', { class: '@class' });
});
CrudApp.factory('RelatedClass', function($resource) { 
	return $resource('/api/:class/:related/list', { class: '@class', related: '@related' });
});
CrudApp.factory('Schema', function($resource) { 
	return $resource('/api/schema',{},{query: {isArray: false}});
});
CrudApp.factory('RelatedListCtrl', function($resource) { 
	return $resource('/api/:class/:id/:related/list', { class: '@class' });
});

CrudApp.factory('ClassItem', function($resource) {
	return $resource('/api/:class', { class: '@class' });
});

CrudApp.factory('Item', function($resource) {
	return $resource('/api/:class/:id', { class: '@class', id: '@id' });
});

CrudApp.factory('Menu', function($resource) {
	return $resource('/api/menu');
});

CrudApp.factory("Breadcrumbs", function(){
	 return {};
});

CrudApp.factory("RelatedItems", function($resource){
	return $resource('/api/:class/:id/:related/items', { class: '@class' });
});

CrudApp.factory("RelatedItem", function($resource){
	return $resource('/api/:class/:id/:related/:related_id', 
	    { class: '@class', id: '@id', related: '@related', related_id: '@related_id' },
	    {
	    	add: {
		        method: 'POST',
		      },
		    remove: {
		        method: 'DELETE',
		      }
	  });

});


// Controllers


var RelatedListCtrl = function ($scope, $routeParams, $location, $rootScope, Class, ClassItem, RelatedListCtrl,  RelatedItem, RelatedItems) {
	$scope.item = RelatedListCtrl.get({
		class: $routeParams.class,
		id: $routeParams.id,
		related: $routeParams.related},
		// Success
		function(data) {
			$rootScope.breadcrumbs = data.bread_crumbs;
		}
	);
	$scope.sort_column = '';
	$scope.data = {};
	$scope.q = {};
	$scope.sort_desc = false;
	$scope.current_page = 1;
	$scope.actions = 'views/grid/actions/related_class_list.html';

	
	$scope.sort = function (ord) {
        if ($scope.sort_column == ord) { $scope.sort_desc = !$scope.sort_desc; }
        else { $scope.sort_desc = false; }
        $scope.sort_column = ord;
        $scope.reset_items();
    };
    
    $scope.go_to_page = function (set_page) {
    	$scope.current_page = parseInt(set_page);
    	$scope.reset_items();
    };
    
    $scope.reset_items = function () {
        $scope.page = 1;
        $scope.items = [];
        $scope.search();

    };
    
    $scope.remove = function(){
    	var row_id = this.row.id
		RelatedItem.remove({
			class: $routeParams.class,
			id: $routeParams.id,
    		related: $routeParams.related,
    		related_id: this.row.id,
	    	},
	    	// Success
	    	function(data) {
	    		$('#row-'+row_id).fadeOut();
	    	}
		);
	};
    
    $scope.search = function() {    	
    	
    	$scope.data = RelatedItems.get({
    		class: $routeParams.class,
    		id: $routeParams.id,
    		related: $routeParams.related,
    		q: JSON.stringify($scope.q),
    		sort: $scope.sort_column, 
    		descending: $scope.sort_desc ? 1 : 0,
			page: $scope.current_page,
	    	},
	    	// Success
	    	function(data) {
	    		// Pagination
	    		var page_scope = 5;
	    		var current_page = $scope.data.page = parseInt($scope.data.page);
	    		var pages = $scope.data.pages = parseInt($scope.data.pages);
	    		var from_page = (current_page - page_scope > 0) ? (current_page - page_scope) : 1;
	    		var to_page = (current_page + page_scope < pages) ? (current_page + page_scope) : pages;

	    		$scope.page_list = []; 
	    		for (var i = from_page; i <= to_page; i++) {
	    			$scope.page_list.push(i);
	    		}
	    	}
		);
    };
    
    $scope.reset_items();
};


var RelatedClassCtrl = function ($scope, $routeParams, $location, RelatedItem, RelatedClass, ClassItem, RelatedItems) {
	$scope.actions = 'views/grid/actions/related_list.html';
	$scope.sort_column = '';
	$scope.data = {};
	$scope.q = {};
	$scope.sort_desc = false;
	$scope.current_page = 1;
	
	$scope.sort = function (ord) {
        if ($scope.sort_column == ord) { $scope.sort_desc = !$scope.sort_desc; }
        else { $scope.sort_desc = false; }
        $scope.sort_column = ord;
        $scope.reset();
    };
    
    $scope.go_to_page = function (set_page) {
    	$scope.current_page = parseInt(set_page);
    	$scope.reset();
    };
    
    $scope.reset = function () {
        $scope.page = 1;
        $scope.items = [];
        $scope.search();

    };

    $scope.add = function(){
    	
		RelatedItem.add({
			class: $routeParams.class,
			id: $routeParams.id,
    		related: $routeParams.related,
    		related_id: this.row.id,
	    	},
	    	// Success
	    	function(data) {
	    		$scope.reset_items();
	    	}
		);
	};
    
    
    $scope.search = function() {    	
    	
    	$scope.data = RelatedClass.get({
    		class: $routeParams.class,
    		related: $routeParams.related,
    		q: JSON.stringify($scope.q),
    		sort: $scope.sort_column, 
    		descending: $scope.sort_desc ? 1 : 0,
			page: $scope.current_page,
	    	},
	    	// Success
	    	function(data) {
	    		// Pagination
	    		var page_scope = 5;
	    		var current_page = $scope.data.page = parseInt($scope.data.page);
	    		var pages = $scope.data.pages = parseInt($scope.data.pages);
	    		var from_page = (current_page - page_scope > 0) ? (current_page - page_scope) : 1;
	    		var to_page = (current_page + page_scope < pages) ? (current_page + page_scope) : pages;

	    		$scope.page_list = []; 
	    		for (var i = from_page; i <= to_page; i++) {
	    			$scope.page_list.push(i);
	    		}
	    	}
		);
    };
    
    $scope.reset();
};
var RelatedItemsCtrl = function ($scope, $routeParams, $location, $rootScope, RelatedItem, RelatedItems) {
	
};
var BreadcrumbsCtrl = function ($scope, $routeParams, $location, $rootScope) {
	$rootScope.breadcrumbs = [];
};


var IndexCtrl = function ($scope, Schema, Menu) {
	$scope.schema = Schema.get();
};


var CreateCtrl = function ($scope, $routeParams, $location, Class, ClassItem) {
	$scope.item = {};
	$scope.item.values = {};
	$scope.data = ClassItem.get(
		{	class: $routeParams.class,   	},
    	// Success
    	function(data) {
    		// Pagination
    		;
    	}
	);
	$scope.create = 1;
	
	$scope.save = function(){
	
		var item = this.item;
		ClassItem.item;
		ClassItem.save({
			class: $routeParams.class,
			item: item,
	    	},
	    	// Success
	    	function(data) {
	    		$location.path('/'+$routeParams.class+'/list');
	    	}
		);
	};
};

var EditCtrl = function ($scope, $routeParams, $location, Item, ClassItem, $rootScope) {
	$scope.item = Item.get({
		class: $routeParams.class, 
		id: $routeParams.id}
	);
	$scope.data = ClassItem.get({
		class: $routeParams.class,
		},
		// Success
		function(data) {
			$rootScope.breadcrumbs = data.bread_crumbs;
		}
	);
	
	$scope.save = function(){
		
		// ClassItem.item
		ClassItem.save({
			class: $routeParams.class,
			item: this.item,
		},
		// Success
		function(data) {
			$location.path('/'+$routeParams.class+'/list');
		}
		);
	};

	
	$scope.related = function(){
		var related = this.link.foreign;
		$location.path('/'+$routeParams.class+'/'+$routeParams.id+'/'+related+'/list');
	};
};


var ListCtrl = function ($scope, $routeParams, $location, Class, ClassItem) {
	// $scope.data = Class.get({class: $routeParams.class});
	$scope.sort_column = '';
	$scope.data = {};
	$scope.item = {};
	$scope.item.values = {};
	$scope.sort_desc = false;
	$scope.current_page = 1;
	$scope.actions = 'views/grid/actions/class_list.html';
	
	$scope.sort = function (ord) {
        if ($scope.sort_column == ord) { $scope.sort_desc = !$scope.sort_desc; }
        else { $scope.sort_desc = false; }
        $scope.sort_column = ord;
        $scope.reset();
    };
    
    $scope.go_to_page = function (set_page) {
    	$scope.current_page = parseInt(set_page);
    	$scope.reset();
    };
    
    $scope.reset = function () {
        $scope.page = 1;
        $scope.items = [];
        $scope.search();
    };
    
    
    $scope.del = function () {
    	if (confirm('Do you realy want to delete '+this.row.id)){
    		var id = this.row.id;
    		$location.path('/'+$routeParams.class+'/list');
    		ClassItem.delete(
    				{id: id, class: $routeParams.class},
    				// On success
    				function(){
    					$('#row-'+id).fadeOut();
    				}
    		);
    	}
    };

    
    $scope.edit = function () {
		var id = this.row.id;
		$location.path('/'+$routeParams.class+'/edit/'+id);		
    };
    
    $scope.search = function() {    	
    	
    	$scope.data = Class.get({
    		class: $routeParams.class,
    		q: JSON.stringify($scope.item.values),
    		sort: $scope.sort_column, 
    		descending: $scope.sort_desc ? 1 : 0,
			page: $scope.current_page,
	    	},
	    	// Success
	    	function(data) {
	    		// Pagination
	    		var page_scope = 5;
	    		var current_page = $scope.data.page = parseInt($scope.data.page);
	    		var pages = $scope.data.pages = parseInt($scope.data.pages);
	    		var from_page = (current_page - page_scope > 0) ? (current_page - page_scope) : 1;
	    		var to_page = (current_page + page_scope < pages) ? (current_page + page_scope) : pages;

	    		$scope.page_list = []; 
	    		for (var i = from_page; i <= to_page; i++) {
	    			$scope.page_list.push(i);
	    		}
	    	}
		);
    };
    
    $scope.reset();
};

var SidebarCtrl = function ($scope, $location, Menu) {
	$scope.menu = Menu.query();
};

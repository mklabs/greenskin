(function() {

  var Queue = {};

  Queue.init = function(el, config) {
  	this.el = el;
 	this.$el = $(this.el);

    if (!this.$el.length) return;

    this.data = $.extend({}, this.$el.data(), config || {});

    var socket = this.socket = io.connect('//' + location.hostname + ':3000');
    console.log('init queue');

    this.template = this.$el.find('.js-row-template');
    this.list = this.$el.find('.js-queue-list');
    this.searchList = this.$el.find('.js-search-list');
    this.searchTab = this.$el.find('.js-toggle-search').closest('li');
    this.buildTab = this.$el.find('.js-toggle-queue').closest('li');

    this.input = this.$el.find('.js-input');
    this.input.on('keyup', _.debounce(this.query.bind(this), 500))
    this.$el.on('submit', 'form', this.query.bind(this))

    var self = this;
    this.$el.on('click', '.js-toggle-queue', function(e) {
      e.preventDefault();
      self.input.val('');
      self.buildTab.addClass('active');
      self.searchTab.hide().removeClass('active');
      self.activate(self.list);
    });

    this.$el.on('click', '.js-toggle', function(e) {
      e.preventDefaul();
    });

    socket.on('queue', this.queue.bind(this));
    socket.on('queue.remove', this.remove.bind(this));
  };

  Queue.queue = function queue(data) {
  	console.log('Queue', data);
	var tpl = this.$el.find('[data-id=' + data.id + ']');
	if (!tpl.length) tpl = this.template.clone().appendTo(this.list);

	tpl.data('id', data.id)
	tpl.find('.js-title').html('<a href="' + data.task.url + '">' +data.task.name + '</a>');
	tpl.find('.js-why').text(data.why);
	tpl.find('.js-duration').text(moment(data.timestamp).fromNow());

	tpl.find('.js-url').attr('href', data.url).text(data.url);

	tpl.removeClass('is-hidden').attr('data-id', data.id);
  };

   Queue.remove = function remove(data) {
  	console.log('rm queue', data);
	var tpl = this.$el.find('[data-id=' + data.id + ']');
	if (!tpl.length) return;
	tpl.remove();
  };

   Queue.query = function query(e) {
   	var val = e.target.value;
   	if (!val) {
	   	e.preventDefault();
   		val = this.$el.find('.js-input').val();
   	}

   	var url = '/search';
   	var req = $.post(url, {
	  query: val
   	});

   	var self = this;
   	req.success(function(data) {
   	  self.searchList.empty();
      self.searchTab.show().addClass('active');
      self.buildTab.removeClass('active');
   	  self.activate(self.searchList);
   	  data.jobs.forEach(self.renderSearchItem, self);
   	});

   	req.error(function() {
   	  console.log('nok', arguments);
   	});
  };

  Queue.renderSearchItem = function renderSearchItem(item) {
	var tpl = this.template.clone().appendTo(this.list);

	tpl.attr('href', item.webUrl);

	tpl.find('.js-title').html('<span class="status"></span>' + item.name);
	tpl.find('.js-why').text('');
	tpl.find('.js-last-build').text(item.number);
	tpl.find('.js-duration').text(item.duration);
	tpl.find('.js-finished').text(item.finished);

	tpl.find('.js-url').attr('href', item.webUrl).text(item.url);

	tpl.addClass(item.color);

	tpl.removeClass('is-hidden');

  	this.searchList.append(tpl);
  };

  Queue.activate = function activate(tab) {
  	var tabs = $(tab).closest('.js-tabs').find('.js-tab');
  	tabs.hide();
  	tab.show();
  };

  $(function() {
  	$('.js-queue').each(function() {
  		var el = $(this);
  		var queue = Object.create(Queue);
  		queue.init(el);
  		el.data('queue', queue);
  	});
  });

})();

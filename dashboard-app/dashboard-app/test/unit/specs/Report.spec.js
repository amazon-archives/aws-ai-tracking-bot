import Vue from 'vue';
import Report from '@/components/Report';

describe('Report.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(Report);
    const vm = new Constructor().$mount();
    expect(vm.$el.querySelector('.report div').textContent)
      .to.equal('\n    Fruit\n    ');
  });
});

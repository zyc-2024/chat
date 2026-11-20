<script setup>
import { changelog } from "../data/changelog.js";
import "../styles/pages.css";
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card changelog-card">
			<div class="standalone-head">
				<div>
					<h1>更新日志</h1>
					<p>从最初的聊天记录到 Vue 重写版，一共 {{ changelog.length }} 条记录。</p>
				</div>
				<router-link class="back-link" :to="{ name: 'home' }">
					返回首页
				</router-link>
			</div>

			<table class="changelog-table">
				<thead>
					<tr>
						<th>版本号</th>
						<th>描述</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(item, index) in changelog" :key="item.version + index">
						<td>
							{{ item.version }}
							<span v-if="index === 0" class="latest-tag">最新</span>
						</td>
						<td>{{ item.desc }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

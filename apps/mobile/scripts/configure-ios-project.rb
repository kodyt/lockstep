require 'xcodeproj'

project_path = File.expand_path('../ios/Lockstep.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |target| target.name == 'Lockstep' }
raise 'Lockstep target not found' unless app_target

main_group = project.main_group.groups.find { |group| group.display_name == 'Lockstep' }
raise 'Lockstep source group not found' unless main_group

def reference_for(group, path)
  group.files.find { |file| file.path == path } || group.new_reference(path)
end

main_sources = %w[
  Lockstep/LockstepActivityPickerView.swift
  Lockstep/LockstepControlsModule.m
  Lockstep/LockstepControlsModule.swift
  Lockstep/LockstepHealthCoordinator.swift
  Lockstep/LockstepSharedState.swift
]

main_sources.each do |path|
  reference = reference_for(main_group, path)
  app_target.source_build_phase.add_file_reference(reference, true)
end

monitor_group = project.main_group.groups.find { |group| group.display_name == 'LockstepMonitor' }
monitor_group ||= project.main_group.new_group('LockstepMonitor', 'LockstepMonitor')

monitor_target = project.targets.find { |target| target.name == 'LockstepMonitor' }
monitor_target ||= project.new_target(:app_extension, 'LockstepMonitor', :ios, '16.4')

monitor_source = reference_for(monitor_group, 'DeviceActivityMonitorExtension.swift')
reference_for(monitor_group, 'Info.plist')
reference_for(monitor_group, 'LockstepMonitor.entitlements')
monitor_target.source_build_phase.add_file_reference(monitor_source, true)

shared_state = reference_for(main_group, 'Lockstep/LockstepSharedState.swift')
monitor_target.source_build_phase.add_file_reference(shared_state, true)

monitor_target.build_configurations.each do |configuration|
  configuration.build_settings.merge!(
    'APPLICATION_EXTENSION_API_ONLY' => 'YES',
    'CODE_SIGN_ENTITLEMENTS' => 'LockstepMonitor/LockstepMonitor.entitlements',
    'CODE_SIGN_STYLE' => 'Automatic',
    'CURRENT_PROJECT_VERSION' => '1',
    'GENERATE_INFOPLIST_FILE' => 'NO',
    'INFOPLIST_FILE' => 'LockstepMonitor/Info.plist',
    'IPHONEOS_DEPLOYMENT_TARGET' => '16.4',
    'LD_RUNPATH_SEARCH_PATHS' => '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks',
    'MARKETING_VERSION' => '0.1.0',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.kt2102.lockstep.monitor',
    'PRODUCT_NAME' => '$(TARGET_NAME)',
    'SKIP_INSTALL' => 'YES',
    'SWIFT_VERSION' => '5.0',
    'TARGETED_DEVICE_FAMILY' => '1,2'
  )
end

frameworks_group = project.frameworks_group
%w[DeviceActivity FamilyControls ManagedSettings].each do |framework_name|
  framework_path = "System/Library/Frameworks/#{framework_name}.framework"
  framework = frameworks_group.files.find { |file| file.path == framework_path }
  framework ||= frameworks_group.new_file(framework_path, :sdk_root)
  monitor_target.frameworks_build_phase.add_file_reference(framework, true)
end

unless app_target.dependencies.any? { |dependency| dependency.target == monitor_target }
  app_target.add_dependency(monitor_target)
end

embed_phase = app_target.copy_files_build_phases.find { |phase| phase.name == 'Embed App Extensions' }
embed_phase ||= app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'

unless embed_phase.files_references.include?(monitor_target.product_reference)
  build_file = embed_phase.add_file_reference(monitor_target.product_reference, true)
  build_file.settings = { 'ATTRIBUTES' => %w[CodeSignOnCopy RemoveHeadersOnCopy] }
end

project.save

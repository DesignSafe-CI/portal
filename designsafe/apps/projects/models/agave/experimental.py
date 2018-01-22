"""Experimental project models"""
import logging
import six
from designsafe.apps.data.models.agave.base import Model as MetadataModel
from designsafe.apps.data.models.agave import fields
from designsafe.apps.projects.models.agave.base import RelatedEntity, Project

logger = logging.getLogger(__name__)

class ExperimentalProject(Project):
    model_name = 'designsafe.project'
    team_members = fields.ListField('Team Members')
    co_pis = fields.ListField('Co PIs')
    project_type = fields.CharField('Project Type', max_length=255, default='other')
    project_id = fields.CharField('Project Id')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=255, default='')
    pi = fields.CharField('PI', max_length=255)
    award_number = fields.CharField('Award Number', max_length=255)
    associated_projects = fields.ListField('Associated Project')
    ef = fields.CharField('Experimental Facility', max_length=512)
    keywords = fields.CharField('Keywords')

class FileModel(MetadataModel):
    model_name = 'designsafe.file'
    keywords = fields.ListField('Keywords')
    project_UUID = fields.RelatedObjectField(ExperimentalProject, default=[])

class DataTag(MetadataModel):
    _is_nested = True
    file = fields.RelatedObjectField(FileModel, default=[])
    desc = fields.CharField('Description', max_length=512, default='')

class Experiment(RelatedEntity):
    model_name = 'designsafe.project.experiment'
    experiment_type = fields.CharField('Experiment Type', max_length=255, default='other')
    experiment_type_other = fields.CharField('Experiment Type Other', max_length=255, default='')
    description = fields.CharField('Description', max_length=1024, default='')
    title = fields.CharField('Title', max_length=1024)
    experimental_facility = fields.CharField('Experimental Facility', max_length=1024)
    experimental_facility_other = fields.CharField('Experimental Facility Other', max_length=1024)
    equipment_type = fields.CharField('Equipment Type')
    equipment_type_other = fields.CharField('Equipment Type Other')
    authors = fields.ListField('Authors')
    project = fields.RelatedObjectField(ExperimentalProject)

class AnalysisTagGeneral(MetadataModel):
    _is_nested = True
    analysis_data_graph = fields.ListField('Analysis Data Graph', list_cls=DataTag)
    analysis_data_visualization = fields.ListField('Analysis Data Visualization', list_cls=DataTag)
    analysis_data_table = fields.ListField('Analysis Data Table', list_cls=DataTag)
    application = fields.ListField('Application', list_cls=DataTag)
    application_matlab = fields.ListField('Application MATLAB', list_cls=DataTag)
    application_r = fields.ListField('Application R', list_cls=DataTag)
    application_jupiter_notebook = fields.ListField('Application Notebook', list_cls=DataTag)
    application_other = fields.ListField('Application Other', list_cls=DataTag)
    application_script = fields.ListField('Application Script', list_cls=DataTag)

class AnalysisTag(MetadataModel):
    _is_nested = True
    general = fields.NestedObjectField(AnalysisTagGeneral)

class Analysis(RelatedEntity):
    model_name = 'designsafe.project.analysis'
    analysis_type = fields.CharField('Analysis Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    analysis_data = fields.CharField('Analysis Data', max_length=1024, default='')
    application = fields.CharField('Analysis Data', max_length=1024, default='')
    script = fields.RelatedObjectField(FileModel, multiple=True)
    tags = fields.NestedObjectField(AnalysisTag)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class ModelConfigTagCentrifuge(MetadataModel):
    _is_nested = True
    triaxial_test = fields.ListField('Triaxal Test', list_cls=DataTag)
    soil_strenght = fields.ListField('Soil Strength', list_cls=DataTag)
    hinged_plate_container = fields.ListField('Hinged Plate Container', list_cls=DataTag)
    rigid_container = fields.ListField('Rigid Container', list_cls=DataTag)
    flexible_shear_beam_container = fields.ListField('Flexible Shear Beam Container', list_cls=DataTag)
    structural_model = fields.ListField('Structural Model', list_cls=DataTag)
    gravel = fields.ListField('Gravel', list_cls=DataTag)
    sand = fields.ListField('Sand', list_cls=DataTag)
    silt = fields.ListField('Silt', list_cls=DataTag)
    clay = fields.ListField('Clay', list_cls=DataTag)
    pit = fields.ListField('pit', list_cls=DataTag)

class ModelConfigTagShakeTable(MetadataModel):
    _is_nested = True
    numerical_model = fields.ListField('Numerical Model', list_cls=DataTag)
    loading_protocol_intensity = fields.ListField('Loading Protocol', list_cls=DataTag)
    loading_protocol_ground_motions = fields.ListField('Loading Protocol Ground Motions', list_cls=DataTag)
    material_test = fields.ListField('Material Test', list_cls=DataTag)
    structural_model = fields.ListField('Structural Model', list_cls=DataTag)
    soil = fields.ListField('Soil', list_cls=DataTag)
    steel = fields.ListField('Steel', list_cls=DataTag)
    concrete = fields.ListField('Concrete', list_cls=DataTag)
    wood = fields.ListField('Wood', list_cls=DataTag)
    masonry = fields.ListField('Masonry', list_cls=DataTag)
    protective_system_isolation = fields.ListField('Protective System Isolation', list_cls=DataTag)
    protective_system_rocking = fields.ListField('Protective System Rocking', list_cls=DataTag)
    protective_system_damping = fields.ListField('Protective System Damping', list_cls=DataTag)

class ModelConfigTagWave(MetadataModel):
    _is_nested = True
    large_wave_flume = fields.ListField('Large Wave Flume', list_cls=DataTag)
    directional_wave_basin = fields.ListField('Directional Wave Basin', list_cls=DataTag)
    wavemaker_input_file = fields.ListField('Wavemaker Input File', list_cls=DataTag)
    board_siplacement = fields.ListField('Board Siplacement', list_cls=DataTag)
    free_surface_height = fields.ListField('Free Surface Height', list_cls=DataTag)
    hydrodynamic_conditions = fields.ListField('Hydrodynamic Conditions', list_cls=DataTag)

class ModelConfigTagWind(MetadataModel):
    _is_nested = True
    bridge = fields.ListField('Bridge', list_cls=DataTag)
    building_low_rise = fields.ListField('Building Low Rise', list_cls=DataTag)
    building_tall = fields.ListField('Building Tall', list_cls=DataTag)
    chimney = fields.ListField('Chimney', list_cls=DataTag)
    mast = fields.ListField('Mast', list_cls=DataTag)
    model_aeroelastic = fields.ListField('Model Aeroelastic', list_cls=DataTag)
    model_full = fields.ListField('Model Full', list_cls=DataTag)
    model_rigid = fields.ListField('Model Rigid', list_cls=DataTag)
    model_section = fields.ListField('Model Section', list_cls=DataTag)
    scale_full = fields.ListField('Scale Full', list_cls=DataTag)
    scale_large = fields.ListField('Scale Large', list_cls=DataTag)
    scale_small = fields.ListField('Scale Small', list_cls=DataTag)
    tower = fields.ListField('Tower', list_cls=DataTag)

class ModelConfigTagGeneral(MetadataModel):
    _is_nested = True
    model_drawing = fields.ListField('Model Drawing', list_cls=DataTag)
    image = fields.ListField('Model Drawing', list_cls=DataTag)
    video = fields.ListField('Model Drawing', list_cls=DataTag)

class ModelConfigTag(MetadataModel):
    _is_nested = True
    centrifuge = fields.NestedObjectField(ModelConfigTagCentrifuge)
    general = fields.NestedObjectField(ModelConfigTagGeneral)
    shake_table = fields.NestedObjectField(ModelConfigTagShakeTable)
    wave = fields.NestedObjectField(ModelConfigTagWave)
    wind = fields.NestedObjectField(ModelConfigTagWind)

class ModelConfig(RelatedEntity):
    model_name = 'designsafe.project.model_config'
    title = fields.CharField('Title', max_length=512)
    description = fields.CharField('Description', max_length=1024, default='')
    #spatial = fields.CharField('Spatial', max_length=1024)
    #lat = fields.CharField('Lat', max_length=1024)
    #lon = fields.CharField('Lon', max_length=1024)
    #model_drawing = fields.RelatedObjectField(FileModel, multiple=True)
    #image = fields.NestedObjectField(DataTag)
    #video = fields.NestedObjectField(DataTag)
    tags = fields.NestedObjectField(ModelConfigTag)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class SensorListTagCentrifuge(MetadataModel):
    _is_nested = True
    strain_gauge = fields.ListField('Strain Gauge', list_cls=DataTag)
    bender_element = fields.ListField('Bender Element', list_cls=DataTag)
    load_cell = fields.ListField('Load Cell', list_cls=DataTag)
    lineal_potentiometer = fields.ListField('Lineal Potentiometer', list_cls=DataTag)
    tactile_pressure = fields.ListField('Tactile Pressure', list_cls=DataTag)
    pore_pressure_transducer = fields.ListField('Pore Pressure Transducer', list_cls=DataTag)
    linear_variable_differential_transformer = fields.ListField('Linear Variable Differential Transformer', list_cls=DataTag)
    accelerometer = fields.ListField('Accelerometer', list_cls=DataTag)
    sensor_calibration = fields.ListField('Sensor Calibration', list_cls=DataTag)

class SensorListTagShakeTable(MetadataModel):
    _is_nested = True
    accelerometer = fields.ListField('Accelerometer', list_cls=DataTag)
    linear_potentiometer = fields.ListField('Linear Potentiometer', list_cls=DataTag)
    displacement_sensor = fields.ListField('Displacement Sensor', list_cls=DataTag)
    load_cell = fields.ListField('Load Cell', list_cls=DataTag)
    soil_sensor = fields.ListField('Soil Sensor', list_cls=DataTag)
    strain_gauge = fields.ListField('Strain Gauge', list_cls=DataTag)

class SensorListTagWave(MetadataModel):
    _is_nested = True
    wave_gauge_calibration = fields.ListField('Wave Gauge Calibration', list_cls=DataTag)
    synchronization = fields.ListField('Synchronization', list_cls=DataTag)
    sample_synchronization = fields.ListField('Sample Synchronization', list_cls=DataTag)
    project_instrumentation_locations = fields.ListField('Project Instrumentation Locations', list_cls=DataTag)
    self_calibrating = fields.ListField('Self Calibrating', list_cls=DataTag)
    instrument_survey = fields.ListField('Instrument Survey', list_cls=DataTag)
    absolute_timing = fields.ListField('Absolute Timing', list_cls=DataTag)
    wiring_details = fields.ListField('Wiring Details', list_cls=DataTag)
    calibration_summary = fields.ListField('Calibration Summary', list_cls=DataTag)

class SensorListTagWind(MetadataModel):
    _is_nested = True
    accelerometer = fields.ListField('Accelerometer', list_cls=DataTag)
    component_velocity_and_statistic_pressure_robes = fields.ListField('Component Velocity And Stastic Pressure Robes', list_cls=DataTag)
    inertial = fields.ListField('Intertial', list_cls=DataTag)
    laser = fields.ListField('Laser', list_cls=DataTag)
    linear_variable_differential_transformer = fields.ListField('Linear Variable Differential Transformer', list_cls=DataTag)
    load_cells = fields.ListField('Load Cells', list_cls=DataTag)
    particle_image_velocimetry = fields.ListField('Particle Image Velocimetry', list_cls=DataTag)
    pitot_tube = fields.ListField('Pitot Tube', list_cls=DataTag)
    pressure_scanner = fields.ListField('Pressure Scanner', list_cls=DataTag)
    strain_gauge = fields.ListField('Strain Gauge', list_cls=DataTag)
    string_potentiometer = fields.ListField('String Potentiometer', list_cls=DataTag)

class SensorListTagGeneral(MetadataModel):
    _is_nested = True
    sensor_list = fields.ListField('Sensor List', list_cls=DataTag)
    sensor_drawing = fields.ListField('Sensor Drawing', list_cls=DataTag)

class SensorListTag(MetadataModel):
    _is_nested = True
    centrifuge = fields.NestedObjectField(SensorListTagCentrifuge)
    general = fields.NestedObjectField(SensorListTagGeneral)
    shake_table = fields.NestedObjectField(SensorListTagShakeTable)
    wave = fields.NestedObjectField(SensorListTagWave)
    wind = fields.NestedObjectField(SensorListTagWind)

class SensorList(RelatedEntity):
    model_name = 'designsafe.project.sensor_list'
    sensor_list_type = fields.CharField('Sensor List Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    #sensor_drawing = fields.RelatedObjectField(FileModel, multiple=True)
    tags = fields.NestedObjectField(SensorListTag)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    #events = fields.RelatedObjectField(Event)
    model_configs = fields.RelatedObjectField(ModelConfig)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class EventTagCentrifuge(MetadataModel):
    _is_nested=True
    centrifuge_speed = fields.ListField('Centrifuge Speed', list_cls=DataTag)
    slow_data = fields.ListField('Slow Data', list_cls=DataTag)
    fast_data = fields.ListField('Fast Data', list_cls=DataTag)
    t_bar_test = fields.ListField('T-Bar Test', list_cls=DataTag)
    bender_element_test = fields.ListField('Bender Element Test', list_cls=DataTag)
    actuator = fields.ListField('Actuator', list_cls=DataTag)
    cone_penetrometer = fields.ListField('Cone Penetrometer', list_cls=DataTag)
    shaking = fields.ListField('Shaking', list_cls=DataTag)
    raw = fields.ListField('Raw', list_cls=DataTag)
    calibrated = fields.ListField('Calibrated', list_cls=DataTag)

class EventTagShakeTable(MetadataModel):
    _is_nested=True
    shake_table_test = fields.ListField('Shaek Table Test', list_cls=DataTag)

class EventTagWave(MetadataModel):
    _is_nested=True
    bathymetric_survey_data = fields.ListField('Bathymetric Survey Data', list_cls=DataTag)
    instrumet_calibration_data = fields.ListField('Instrument Calibration Data', list_cls=DataTag)
    experimental_conditions = fields.ListField('Experimental Conditions', list_cls=DataTag)
    raw = fields.ListField('Raw', list_cls=DataTag)
    physical_units = fields.ListField('Physical Units', list_cls=DataTag)
    channel_name = fields.ListField('Channel Name', list_cls=DataTag)
    matlab_toolbox_source_code = fields.ListField('Matlab Toolbox Source Code', list_cls=DataTag)

class EventTagWind(MetadataModel):
    _is_nested=True
    aerodynamic_roughness = fields.ListField('Aerodynamic', list_cls=DataTag)
    flow_boundary_layer = fields.ListField('Flow Boundary Layer', list_cls=DataTag)
    flow_profile = fields.ListField('Flow Profile', list_cls=DataTag)
    flow_steady_gusting = fields.ListField('Flow Steady Gusting', list_cls=DataTag)
    incident_flow = fields.ListField('Incident Flow', list_cls=DataTag)
    reynolds_number = fields.ListField('Reynolds Number', list_cls=DataTag)
    reynolds_stress = fields.ListField('Reynolds Stress', list_cls=DataTag)
    scale_integral_length = fields.ListField('Scale Inetgral Length', list_cls=DataTag)
    terrain_open = fields.ListField('Terrain Open', list_cls=DataTag)
    terrain_urban = fields.ListField('Terrain Urban', list_cls=DataTag)
    test_aerodynamic = fields.ListField('Test Aerodynamic', list_cls=DataTag)
    test_complex_topography = fields.ListField('Test Complex Topography', list_cls=DataTag)
    test_destructive = fields.ListField('Test Destructive', list_cls=DataTag)
    test_dispersion = fields.ListField('Test Dispersion', list_cls=DataTag)
    test_environmental = fields.ListField('Test Environmental', list_cls=DataTag)
    test_external_pressure = fields.ListField('Test External Pressure', list_cls=DataTag)
    test_high_frequency_force_balance = fields.ListField('Test high Frequency Force Balance', list_cls=DataTag)
    test_internal_pressure = fields.ListField('Test Internal Pressure', list_cls=DataTag)
    test_pedestrian_level_winds = fields.ListField('Test Pedestrian Level Winds', list_cls=DataTag)
    turbulence_profile = fields.ListField('Turbulance Profile', list_cls=DataTag)
    turbulence_spectrum = fields.ListField('Turbulence Spectrum', list_cls=DataTag)
    uniform_flow = fields.ListField('Uniform Flow', list_cls=DataTag)
    velocity_mean = fields.ListField('Velocity Mean', list_cls=DataTag)
    velocity_profile = fields.ListField('Velocity Profile', list_cls=DataTag)
    wind_direction = fields.ListField('Wind Direction', list_cls=DataTag)
    wind_duration = fields.ListField('Wind Duration', list_cls=DataTag)
    wind_speed = fields.ListField('Wind Speed', list_cls=DataTag)
    wind_tunnel_open_circuit = fields.ListField('Wind Tunnel Open Circuit', list_cls=DataTag)
    wind_tunnel_open_jet = fields.ListField('Wind Tunnel Open Jet', list_cls=DataTag)
    wind_tunnel_closed_circuit = fields.ListField('Wind Tunnel closed Circuit', list_cls=DataTag)
    three_sec_gust = fields.ListField('Three Sec Gust', list_cls=DataTag)

class EventTagGeneral(MetadataModel):
    _is_nested=True
    data_units = fields.ListField('Data Units', list_cls=DataTag)
    image = fields.ListField('Image', list_cls=DataTag)
    video = fields.ListField('Video', list_cls=DataTag)

class EventTag(MetadataModel):
    _is_nested = True
    centrifuge = fields.NestedObjectField(EventTagCentrifuge)
    general = fields.NestedObjectField(EventTagGeneral)
    shake_table = fields.NestedObjectField(EventTagShakeTable)
    wave = fields.NestedObjectField(EventTagWave)
    wind = fields.NestedObjectField(EventTagWind)

class Event(RelatedEntity):
    model_name = 'designsafe.project.event'
    event_type = fields.CharField('Event Type', max_length=255, default='other')
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    #load = fields.RelatedObjectField(FileModel, multiple=True)
    tags = fields.NestedObjectField(SensorListTag)
    analysis = fields.RelatedObjectField(Analysis)
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    model_configs = fields.RelatedObjectField(ModelConfig)
    sensor_lists = fields.RelatedObjectField(SensorList)
    files = fields.RelatedObjectField(FileModel, multiple=True)

class Report(RelatedEntity):
    model_name = 'designsafe.project.report'
    title = fields.CharField('Title', max_length=1024)
    description = fields.CharField('Description', max_length=1024, default='')
    project = fields.RelatedObjectField(ExperimentalProject)
    experiments = fields.RelatedObjectField(Experiment)
    files = fields.RelatedObjectField(FileModel, multiple=True)
